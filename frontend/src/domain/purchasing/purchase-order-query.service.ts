import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedPurchaseOrderAggregate } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseOrderRepository } from '@/domain/ports/persistence/aggregates/purchase-order.repository'
import type { PurchaseOrderAggregate } from '@/domain/purchasing/purchasing.types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function repo(): IPurchaseOrderRepository {
  return requireUnitOfWork().purchaseOrders
}

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

export function queryAllPurchaseOrders(): PurchaseOrderAggregate[] {
  return repo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
    .items.map(strip)
}

export function queryPurchaseOrderById(id: string): PurchaseOrderAggregate | null {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryPurchaseOrderByNo(poNo: string): PurchaseOrderAggregate | null {
  const row = repo().findByPurchaseOrderNo(DEFAULT_TENANT_ID, poNo)
  return row ? strip(row) : null
}

export function queryPurchaseOrderVersion(id: string): number {
  return repo().version(DEFAULT_TENANT_ID, id)
}
