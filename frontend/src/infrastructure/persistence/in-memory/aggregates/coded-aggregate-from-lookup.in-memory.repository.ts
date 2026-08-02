import type { BaseMasterEntity } from '@/domain/master-data/types'
import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedMasterEntity } from '@/domain/ports/persistence/persistence-aggregates'
import type { ICodedAggregateRepository } from '@/domain/ports/persistence/repository.base'
import type { IMasterDataLookupRepository } from '@/domain/ports/persistence/lookups/master-data-lookup.repository'

import { conflictError, paginate } from '../in-memory-helpers'

function toPersisted<T extends BaseMasterEntity>(tenantId: string, entity: T): PersistedMasterEntity<T> {
  return {
    ...entity,
    tenantId,
    version: entity.version ?? 1,
    schemaVersion: 1,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt ?? null,
  }
}

function fromPersisted<T extends BaseMasterEntity>(row: PersistedMasterEntity<T>): T {
  const { tenantId: _t, schemaVersion: _s, ...rest } = row
  return rest as T
}

/** Coded aggregate port — lookup registry üzerinden delegasyon */
export class CodedAggregateFromLookupInMemoryRepository<T extends BaseMasterEntity>
  implements ICodedAggregateRepository<PersistedMasterEntity<T>>
{
  private readonly lookup: IMasterDataLookupRepository<T>

  constructor(lookup: IMasterDataLookupRepository<T>) {
    this.lookup = lookup
  }

  findById(tenantId: string, id: string): PersistedMasterEntity<T> | null {
    const row = this.lookup.getById(tenantId, id)
    return row ? toPersisted(tenantId, row) : null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedMasterEntity<T> | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedMasterEntity<T> | null {
    const row = this.lookup.getByCode(tenantId, code)
    return row ? toPersisted(tenantId, row) : null
  }

  save(tenantId: string, aggregate: PersistedMasterEntity<T>, options?: { expectedVersion?: number }): PersistedMasterEntity<T> {
    const existing = this.lookup.getById(tenantId, aggregate.id)
    if (options?.expectedVersion != null && existing && existing.version !== options.expectedVersion) {
      throw conflictError('MasterData', aggregate.id, options.expectedVersion, existing.version)
    }
    const entity = fromPersisted(aggregate)
    const saved = this.lookup.save(tenantId, {
      ...entity,
      version: existing ? existing.version + 1 : entity.version ?? 1,
      updatedAt: new Date().toISOString(),
    })
    return toPersisted(tenantId, saved)
  }

  delete(tenantId: string, id: string): void {
    const existing = this.lookup.getById(tenantId, id)
    if (!existing) return
    this.lookup.save(tenantId, {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  exists(tenantId: string, id: string): boolean {
    return this.lookup.getById(tenantId, id) != null
  }

  version(tenantId: string, id: string): number {
    return this.lookup.getById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedMasterEntity<T>> {
    const items = this.lookup.getAll(tenantId).map((e) => toPersisted(tenantId, e))
    return paginate(items, page)
  }
}
