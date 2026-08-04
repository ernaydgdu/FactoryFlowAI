/** Production Order query — runtime reads via repository port */
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedProductionOrder } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductionOrderRepository } from '@/domain/ports/persistence/aggregates/production-order.repository'
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function productionOrderRepo(): IProductionOrderRepository {
  return requireUnitOfWork().productionOrders
}

function strip(row: PersistedProductionOrder): ProductionOrderLifecycleRecord {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

export function queryAllProductionOrders(): ProductionOrderLifecycleRecord[] {
  const page = productionOrderRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(strip)
}

export function queryProductionOrderByNo(productionOrderNo: string): ProductionOrderLifecycleRecord | null {
  const row = productionOrderRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo)
  return row ? strip(row) : null
}

export function queryProductionOrdersBySalesOrderId(salesOrderId: string): ProductionOrderLifecycleRecord[] {
  return productionOrderRepo()
    .findBySalesOrderId(DEFAULT_TENANT_ID, salesOrderId)
    .map(strip)
}
