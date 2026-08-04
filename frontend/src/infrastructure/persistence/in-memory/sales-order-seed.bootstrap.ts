/**
 * Sales Order seed bootstrap — domain/data/orders.ts yalnızca seed kaynağı.
 */
import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { generateSeedSalesOrders } from '@/domain/data/orders'
import type { PersistedSalesOrder } from '@/domain/ports/persistence/persistence-aggregates'

import { inMemoryStoreRegistry } from './store-registry'

let seeded = false

export function ensureSalesOrdersSeeded(): void {
  if (seeded || inMemoryStoreRegistry.salesOrders.length > 0) {
    seeded = true
    return
  }

  const orders = generateSeedSalesOrders()
  const now = new Date().toISOString()

  inMemoryStoreRegistry.salesOrders = orders.map((order): PersistedSalesOrder => ({
    ...order,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }))

  inMemoryStoreRegistry.salesOrderCounter = orders.length
  seeded = true
}

export function resetSalesOrderSeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.salesOrders = []
  inMemoryStoreRegistry.salesOrderCounter = 0
}
