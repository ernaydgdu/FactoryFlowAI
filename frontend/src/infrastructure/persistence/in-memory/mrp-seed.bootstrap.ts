/**
 * MRP Run seed — initial planning snapshot after sales orders seeded.
 */
import { persistRunMrp } from '@/domain/mrp/mrp-crud.service'
import { seedFromSalesOrders } from '@/domain/production-order/lifecycle-seed.bootstrap'

import { inMemoryStoreRegistry } from './store-registry'
import { ensurePurchasingSeeded } from './purchasing-seed.bootstrap'

let seeded = false

export function ensureMrpRunsSeeded(): void {
  if (seeded || inMemoryStoreRegistry.mrpRuns.length > 0) {
    seeded = true
    return
  }

  seedFromSalesOrders()
  persistRunMrp('system')
  ensurePurchasingSeeded()
  seeded = true
}

export function resetMrpRunSeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.mrpRuns = []
}
