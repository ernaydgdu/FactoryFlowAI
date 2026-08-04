import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPurchaseOrderAggregate } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseOrderRepository } from '@/domain/ports/persistence/aggregates/purchase-order.repository'
import type { PurchaseOrderAggregate } from '@/domain/purchasing/purchasing.types'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function strip(row: PersistedPurchaseOrderAggregate): PurchaseOrderAggregate {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...po
  } = row
  return po as PurchaseOrderAggregate
}

export class PurchaseOrderInMemoryRepository implements IPurchaseOrderRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedPurchaseOrderAggregate | null {
    return (
      this.stores.purchaseOrders.find((o) => o.tenantId === tenantId && o.id === id && !o.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedPurchaseOrderAggregate | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedPurchaseOrderAggregate | null {
    return this.findByPurchaseOrderNo(tenantId, code)
  }

  findByPurchaseOrderNo(tenantId: string, purchaseOrderNo: string): PersistedPurchaseOrderAggregate | null {
    return (
      this.stores.purchaseOrders.find(
        (o) => o.tenantId === tenantId && o.poNo === purchaseOrderNo && !o.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedPurchaseOrderAggregate,
    options?: { expectedVersion?: number },
  ): PersistedPurchaseOrderAggregate {
    const idx = this.stores.purchaseOrders.findIndex(
      (o) => o.tenantId === tenantId && o.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.purchaseOrders[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('PurchaseOrder', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedPurchaseOrderAggregate = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.purchaseOrders[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.purchaseOrders[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.purchaseOrders[idx] = next
    else this.stores.purchaseOrders.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.purchaseOrders.findIndex((o) => o.tenantId === tenantId && o.id === id)
    if (idx >= 0) {
      this.stores.purchaseOrders[idx] = {
        ...this.stores.purchaseOrders[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.purchaseOrders.some(
      (o) => o.tenantId === tenantId && o.id === id && !o.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedPurchaseOrderAggregate> {
    let rows = this.stores.purchaseOrders.filter((o) => o.tenantId === tenantId && !o.deletedAt)
    if (typeof filter.status === 'string') {
      rows = rows.filter((o) => o.status === filter.status)
    }
    rows.sort((a, b) => b.poNo.localeCompare(a.poNo))
    return paginate(rows, page)
  }

  listAll(tenantId: string): PurchaseOrderAggregate[] {
    return this.stores.purchaseOrders
      .filter((o) => o.tenantId === tenantId && !o.deletedAt)
      .map(strip)
  }
}
