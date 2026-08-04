import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPackingList } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPackingListRepository } from '@/domain/ports/persistence/aggregates/packing-list.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class PackingListInMemoryRepository implements IPackingListRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedPackingList | null {
    return (
      this.stores.packingLists.find((p) => p.tenantId === tenantId && p.id === id && !p.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedPackingList | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedPackingList | null {
    return this.findByPackingListNo(tenantId, code)
  }

  findByPackingListNo(tenantId: string, packingListNo: string): PersistedPackingList | null {
    return (
      this.stores.packingLists.find(
        (p) => p.tenantId === tenantId && p.packingListNo === packingListNo && !p.deletedAt,
      ) ?? null
    )
  }

  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedPackingList[] {
    return this.stores.packingLists.filter(
      (p) => p.tenantId === tenantId && p.salesOrderId === salesOrderId && !p.deletedAt,
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedPackingList | null {
    return (
      this.stores.packingLists.find(
        (p) => p.tenantId === tenantId && p.idempotencyKey === idempotencyKey && !p.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedPackingList,
    options?: { expectedVersion?: number },
  ): PersistedPackingList {
    const idx = this.stores.packingLists.findIndex(
      (p) => p.tenantId === tenantId && p.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.packingLists[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('PackingList', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedPackingList = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.packingLists[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.packingLists[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.packingLists[idx] = next
    else this.stores.packingLists.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.packingLists.findIndex((p) => p.tenantId === tenantId && p.id === id)
    if (idx >= 0) {
      this.stores.packingLists[idx] = {
        ...this.stores.packingLists[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.packingLists.some(
      (p) => p.tenantId === tenantId && p.id === id && !p.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedPackingList> {
    const rows = this.stores.packingLists
      .filter((p) => p.tenantId === tenantId && !p.deletedAt)
      .sort((a, b) => b.packingListNo.localeCompare(a.packingListNo))
    return paginate(rows, page)
  }
}
