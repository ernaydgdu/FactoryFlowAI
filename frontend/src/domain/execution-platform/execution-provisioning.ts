/**
 * Execution Provisioning — görünmez otomatik başlatma
 * Kullanıcı manuel initialize yapmaz; PO yaşam döngüsü tetikler.
 */
import { getAllProductionOrderLifecycles, getProductionOrderLifecycle } from '../production-order/lifecycle-service'
import type { ProductionOrderLifecycleRecord, ProductionOrderLifecycleStatus } from '../production-order/lifecycle-types'
import { scheduleWipRefresh } from '../platform/services/outbox-scheduler'
import {
  getExecutionContext,
  initializeExecutionPlatform,
  runCuttingAndBundlePhase,
} from './execution-platform-service'
import { getBundlesForProductionOrder } from './bundle-tracking-service'

const SHOP_FLOOR_STATUSES: ProductionOrderLifecycleStatus[] = [
  'Released',
  'In Production',
  'Paused',
  'Completed',
  'Closed',
]

/** UE için execution context + operasyon route + WIP index (idempotent) */
export function ensureExecutionContextForOrder(productionOrderNo: string, actor = 'system'): void {
  const po = getProductionOrderLifecycle(productionOrderNo)
  if (!po || po.status === 'Cancelled') return

  initializeExecutionPlatform(productionOrderNo, actor, {
    workshopCode: po.workshopCode,
    plannedQty: po.plannedQty,
    salesOrderId: po.salesOrderId,
    salesOrderNo: po.salesOrderNo,
    productCode: po.productCode,
  })
  scheduleWipRefresh(productionOrderNo, actor)
}

/** Bundle gerektiğinde otomatik oluştur (Released+ ve bundle yoksa) */
export function ensureShopFloorBundlesForOrder(productionOrderNo: string, actor = 'system'): void {
  const po = getProductionOrderLifecycle(productionOrderNo)
  if (!po || po.status === 'Cancelled') return
  if (!SHOP_FLOOR_STATUSES.includes(po.status)) return

  ensureExecutionContextForOrder(productionOrderNo, actor)

  const bundles = getBundlesForProductionOrder(productionOrderNo)
  if (bundles.length > 0) return

  runCuttingAndBundlePhase(productionOrderNo, actor)
  scheduleWipRefresh(productionOrderNo, actor)
}

/** Tüm aktif UE'leri execution platform ile senkronize et */
export function syncAllActiveProductionOrders(actor = 'system'): void {
  for (const po of getAllProductionOrderLifecycles()) {
    if (po.status === 'Cancelled') continue
    ensureExecutionContextForOrder(po.productionOrderNo, actor)
    if (SHOP_FLOOR_STATUSES.includes(po.status)) {
      ensureShopFloorBundlesForOrder(po.productionOrderNo, actor)
    }
  }
}

export function onProductionOrderCreated(record: ProductionOrderLifecycleRecord, actor: string): void {
  ensureExecutionContextForOrder(record.productionOrderNo, actor)
}

export function onProductionOrderStatusChanged(
  record: ProductionOrderLifecycleRecord,
  actor: string,
): void {
  ensureExecutionContextForOrder(record.productionOrderNo, actor)
  if (record.status === 'In Production' || record.status === 'Released') {
    ensureShopFloorBundlesForOrder(record.productionOrderNo, actor)
  }
  if (getExecutionContext(record.productionOrderNo)) {
    scheduleWipRefresh(record.productionOrderNo, actor)
  }
}

/** @internal Yalnızca Developer Tool — production UI'da kullanılmaz */
export function initializeDemoExecutionData(actor = 'dev-tools'): {
  contextsSynced: number
  bundlesProvisioned: number
} {
  syncAllActiveProductionOrders(actor)
  let bundlesProvisioned = 0
  for (const po of getAllProductionOrderLifecycles()) {
    if (po.status === 'Cancelled') continue
    const before = getBundlesForProductionOrder(po.productionOrderNo).length
    ensureShopFloorBundlesForOrder(po.productionOrderNo, actor)
    const after = getBundlesForProductionOrder(po.productionOrderNo).length
    if (after > before) bundlesProvisioned += 1
  }
  return {
    contextsSynced: getAllProductionOrderLifecycles().filter((p) => p.status !== 'Cancelled').length,
    bundlesProvisioned,
  }
}
