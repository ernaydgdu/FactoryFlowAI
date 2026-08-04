import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedProductionOrder } from '../ports/persistence/persistence-aggregates'
import type { ProductionOrderLifecycleRecord } from './lifecycle-types'

export function productionOrderRepo() {
  return requireUnitOfWork().productionOrders
}

export function saveLifecycleRecord(record: ProductionOrderLifecycleRecord): ProductionOrderLifecycleRecord {
  const existing = productionOrderRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, record.productionOrderNo)
  const now = new Date().toISOString()
  const persisted: PersistedProductionOrder = {
    ...record,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? record.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  }
  productionOrderRepo().save(
    DEFAULT_TENANT_ID,
    persisted,
    existing ? { expectedVersion: existing.version } : undefined,
  )
  return record
}
