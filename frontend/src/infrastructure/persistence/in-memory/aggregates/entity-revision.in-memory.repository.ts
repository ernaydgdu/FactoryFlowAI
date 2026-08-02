import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedEntityRevision } from '@/domain/ports/persistence/persistence-aggregates'
import type { IEntityRevisionRepository } from '@/domain/ports/persistence/aggregates/entity-revision.repository'
import type { VersionedEntityType, VersionedRecord } from '@/domain/platform/types'

import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'
import { conflictError } from '../in-memory-helpers'

export class EntityRevisionInMemoryRepository implements IEntityRevisionRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedEntityRevision | null {
    return this.stores.entityRevisions.find((r) => r.tenantId === tenantId && r.id === id) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedEntityRevision | null {
    return this.findById(tenantId, id)
  }

  save(tenantId: string, aggregate: PersistedEntityRevision, options?: { expectedVersion?: number }): PersistedEntityRevision {
    const idx = this.stores.entityRevisions.findIndex((r) => r.tenantId === tenantId && r.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.entityRevisions[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('EntityRevision', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedEntityRevision = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.entityRevisions[idx]!.version + 1 : aggregate.version,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.entityRevisions[idx] = next
    else this.stores.entityRevisions.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.entityRevisions.findIndex((r) => r.tenantId === tenantId && r.id === id)
    if (idx >= 0) {
      this.stores.entityRevisions[idx] = {
        ...this.stores.entityRevisions[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.entityRevisions.some((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedEntityRevision> {
    const items = this.stores.entityRevisions.filter((r) => r.tenantId === tenantId && !r.deletedAt)
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  findByEntity(tenantId: string, entityType: VersionedEntityType, entityId: string): PersistedEntityRevision[] {
    return this.stores.entityRevisions
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          r.entityType === entityType &&
          r.entityKey === entityId &&
          !r.deletedAt,
      )
      .sort((a, b) => b.revision.revisionNo - a.revision.revisionNo)
  }

  findActive(tenantId: string, entityType: VersionedEntityType, entityId: string): PersistedEntityRevision | null {
    return (
      this.stores.entityRevisions.find(
        (r) =>
          r.tenantId === tenantId &&
          r.entityType === entityType &&
          r.entityKey === entityId &&
          r.revision.status === 'Active' &&
          !r.deletedAt,
      ) ?? null
    )
  }

  replaceAll(records: VersionedRecord[]): void {
    this.stores.seedRevisions(records)
  }

  seedFromLegacy(records: VersionedRecord[]): void {
    this.replaceAll(records)
  }

  allAsLegacy(): VersionedRecord[] {
    return this.stores.entityRevisions
      .filter((r) => !r.deletedAt)
      .map(
        ({
          tenantId: _t,
          version: _v,
          schemaVersion: _s,
          createdAt: _c,
          updatedAt: _u,
          deletedAt: _d,
          ...rest
        }) => rest as VersionedRecord,
      )
  }
}
