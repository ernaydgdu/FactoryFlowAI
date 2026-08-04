import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedStyleClosing } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStyleClosingRepository } from '@/domain/ports/persistence/aggregates/style-closing.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class StyleClosingInMemoryRepository implements IStyleClosingRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedStyleClosing | null {
    return (
      this.stores.styleClosings.find(
        (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedStyleClosing | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedStyleClosing | null {
    return this.findByBatchNo(tenantId, code)
  }

  findByBatchNo(tenantId: string, batchNo: string): PersistedStyleClosing | null {
    return (
      this.stores.styleClosings.find(
        (e) => e.tenantId === tenantId && e.batchNo === batchNo && !e.deletedAt,
      ) ?? null
    )
  }

  findByProductCardId(tenantId: string, productCardId: string): PersistedStyleClosing | null {
    return (
      this.stores.styleClosings.find(
        (e) =>
          e.tenantId === tenantId &&
          e.productCardId === productCardId &&
          e.status !== 'Closed' &&
          !e.deletedAt,
      ) ??
      this.stores.styleClosings.find(
        (e) => e.tenantId === tenantId && e.productCardId === productCardId && !e.deletedAt,
      ) ??
      null
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedStyleClosing | null {
    return (
      this.stores.styleClosings.find(
        (e) => e.tenantId === tenantId && e.idempotencyKey === idempotencyKey && !e.deletedAt,
      ) ?? null
    )
  }

  nextBatchCounter(): number {
    this.stores.styleClosingCounter += 1
    return this.stores.styleClosingCounter
  }

  save(
    tenantId: string,
    aggregate: PersistedStyleClosing,
    options?: { expectedVersion?: number },
  ): PersistedStyleClosing {
    const idx = this.stores.styleClosings.findIndex(
      (e) => e.tenantId === tenantId && e.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.styleClosings[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError(
          'StyleClosing',
          aggregate.id,
          options.expectedVersion,
          current.version,
        )
      }
    }
    const now = new Date().toISOString()
    const next: PersistedStyleClosing = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.styleClosings[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.styleClosings[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.styleClosings[idx] = next
    else this.stores.styleClosings.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.styleClosings.findIndex((e) => e.tenantId === tenantId && e.id === id)
    if (idx >= 0) {
      this.stores.styleClosings[idx] = {
        ...this.stores.styleClosings[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.styleClosings.some(
      (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedStyleClosing> {
    const rows = this.stores.styleClosings
      .filter((e) => e.tenantId === tenantId && !e.deletedAt)
      .sort((a, b) => b.batchNo.localeCompare(a.batchNo))
    return paginate(rows, page)
  }
}
