import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedSalesOrder } from '@/domain/ports/persistence/persistence-aggregates'
import type { ISalesOrderRepository } from '@/domain/ports/persistence/aggregates/sales-order.repository'
import type { SalesOrder } from '@/domain/types'

function salesOrderRepo(): ISalesOrderRepository {
  return requireUnitOfWork().salesOrders
}

function strip(row: PersistedSalesOrder): SalesOrder {
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

export function queryAllSalesOrders(): SalesOrder[] {
  return salesOrderRepo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: 500 })
    .items.map(strip)
}

export function querySalesOrderById(id: string): SalesOrder | null {
  const row = salesOrderRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function querySalesOrderByOrderNo(orderNo: string): SalesOrder | null {
  const row = salesOrderRepo().findByOrderNo(DEFAULT_TENANT_ID, orderNo)
  return row ? strip(row) : null
}

export function querySalesOrderVersion(id: string): number {
  return salesOrderRepo().version(DEFAULT_TENANT_ID, id)
}
