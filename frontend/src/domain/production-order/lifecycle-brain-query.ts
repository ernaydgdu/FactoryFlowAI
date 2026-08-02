/**
 * Production Order Lifecycle Brain Query — READ ONLY
 */
import { buildProductionTracking } from '../services/textile/production-tracking-service'
import { getWorkshopCapacitySnapshots } from '../services/planning/capacity-engine'
import { getSalesOrderById } from '../data/orders'
import {
  getAllProductionOrderLifecycles,
  getProductionOrderLifecycle,
  getRemainingQty,
} from './lifecycle-service'

export type ProductionOrderBrainInsight = {
  productionOrderNo: string
  whyDelayed: string
  biggestBottleneck: string
  waitingOperation: string
  capacitySufficient: boolean
  terminRisk: boolean
  bestWorkshop: string
}

export function analyzeProductionOrderForBrain(productionOrderNo: string): ProductionOrderBrainInsight | null {
  const po = getProductionOrderLifecycle(productionOrderNo)
  if (!po) return null

  const order = getSalesOrderById(po.salesOrderId)
  const tracking = order
    ? buildProductionTracking(order)
    : { operations: [] as ReturnType<typeof buildProductionTracking>['operations'] }

  const bottleneck = [...tracking.operations].sort((a, b) => a.progressPercent - b.progressPercent)[0]
  const waiting = tracking.operations.find((o) => o.progressPercent < 100)
  const workshops = getWorkshopCapacitySnapshots()
  const best = [...workshops].sort((a, b) => b.remaining - a.remaining)[0]
  const ws = workshops.find((w) => w.code === po.workshopCode)
  const remaining = getRemainingQty(po)
  const delayed = remaining > 0 && po.status === 'In Production' && po.producedQty / po.plannedQty < 0.5

  return {
    productionOrderNo: po.productionOrderNo,
    whyDelayed: delayed
      ? `İlerleme %${Math.round((po.producedQty / po.plannedQty) * 100)}, kalan ${remaining} adet, atölye ${po.workshopName}`
      : 'Gecikme tespit edilmedi',
    biggestBottleneck: bottleneck
      ? `${bottleneck.operationName} — %${bottleneck.progressPercent}`
      : 'Darboğaz yok',
    waitingOperation: waiting ? `${waiting.operationName} (%${waiting.progressPercent})` : 'Bekleyen operasyon yok',
    capacitySufficient: ws ? ws.remaining >= remaining : true,
    terminRisk: po.snapshots.planning.terminRiskScore >= 60,
    bestWorkshop: best ? `${best.name} — boş ${best.remaining}` : '—',
  }
}

export function getProductionOrderLifecycleBrainSummary() {
  const orders = getAllProductionOrderLifecycles()
  return {
    total: orders.length,
    inProduction: orders.filter((o) => o.status === 'In Production').length,
    terminRisk: orders.filter((o) => o.snapshots.planning.terminRiskScore >= 60).length,
    delayed: orders.filter((o) => o.status === 'In Production' && o.producedQty / o.plannedQty < 0.5).length,
  }
}
