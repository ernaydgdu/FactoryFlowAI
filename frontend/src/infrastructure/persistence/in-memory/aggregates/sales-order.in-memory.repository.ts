import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedSalesOrder } from '@/domain/ports/persistence/persistence-aggregates'
import type { ISalesOrderRepository } from '@/domain/ports/persistence/aggregates/sales-order.repository'
import type { SalesOrder } from '@/domain/types'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function stripOrder(row: PersistedSalesOrder): SalesOrder {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...order
  } = row
  return order as SalesOrder
}

export class SalesOrderInMemoryRepository implements ISalesOrderRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedSalesOrder | null {
    return (
      this.stores.salesOrders.find((o) => o.tenantId === tenantId && o.id === id && !o.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedSalesOrder | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedSalesOrder | null {
    return this.findByOrderNo(tenantId, code)
  }

  findByOrderNo(tenantId: string, orderNo: string): PersistedSalesOrder | null {
    return (
      this.stores.salesOrders.find(
        (o) => o.tenantId === tenantId && o.orderNo === orderNo && !o.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedSalesOrder,
    options?: { expectedVersion?: number },
  ): PersistedSalesOrder {
    const idx = this.stores.salesOrders.findIndex((o) => o.tenantId === tenantId && o.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.salesOrders[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('SalesOrder', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedSalesOrder = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.salesOrders[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.salesOrders[idx]!.createdAt : now,
    }
    if (idx >= 0) this.stores.salesOrders[idx] = next
    else this.stores.salesOrders.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.salesOrders.findIndex((o) => o.tenantId === tenantId && o.id === id)
    if (idx >= 0) {
      this.stores.salesOrders[idx] = {
        ...this.stores.salesOrders[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.salesOrders.some((o) => o.tenantId === tenantId && o.id === id && !o.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedSalesOrder> {
    let rows = this.stores.salesOrders.filter((o) => o.tenantId === tenantId && !o.deletedAt)
    if (typeof filter.status === 'string') {
      rows = rows.filter((o) => o.status === filter.status)
    }
    if (typeof filter.customerId === 'string') {
      rows = rows.filter((o) => o.general.customer === filter.customerId)
    }
    rows.sort((a, b) => a.orderNo.localeCompare(b.orderNo))
    return paginate(rows, page)
  }

  cursorByCustomer(
    tenantId: string,
    customerId: string,
    page: CursorPage,
  ): PageResult<PersistedSalesOrder> {
    const rows = this.stores.salesOrders.filter(
      (o) => o.tenantId === tenantId && !o.deletedAt && o.general.customer === customerId,
    )
    return paginate(rows, page)
  }

  listAll(tenantId: string): SalesOrder[] {
    return this.stores.salesOrders
      .filter((o) => o.tenantId === tenantId && !o.deletedAt)
      .map(stripOrder)
  }
}
