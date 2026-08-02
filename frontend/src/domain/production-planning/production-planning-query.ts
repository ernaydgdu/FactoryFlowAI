/**
 * Production Planning Query — domain read-only (Brain + Application Layer SSOT)
 */
import { SALES_ORDERS } from '../data/orders'
import { OPERATIONAL_DASHBOARD, SEWING_LINE_RECORDS } from '../data/workflows'
import { productionLineRepository, workshopRepository } from '../master-data'
import { runPlanningEngine } from '../services/planning-engine'
import { buildProductionTracking } from '../services/textile/production-tracking-service'

export type ProductionPlanningBrainSnapshot = {
  orderCount: number
  terminRiskCount: number
  busyLineCount: number
  orders: Array<{
    id: string
    productionOrderNo: string
    salesOrderNo: string
    progress: number
    remainingQty: number
    terminRisk: boolean
    workshop: string
    lineCode: string
  }>
  lines: Array<{ code: string; loadPercent: number; efficiency: number; activeOrders: string[] }>
  workshops: Array<{ code: string; name: string; utilizationPercent: number; freeCapacity: number; assignedOrders: number }>
  operationBottlenecks: Array<{ operation: string; orderNo: string; progress: number }>
  wasteSummary: { fire: number; rework: number; secondQuality: number }
}

export function buildProductionPlanningBrainSnapshot(): ProductionPlanningBrainSnapshot {
  const output = runPlanningEngine(SALES_ORDERS)
  const activeOrders = SALES_ORDERS.filter((o) => o.productionStatus !== 'Beklemede')

  const orders = activeOrders.map((order) => {
    const tracking = buildProductionTracking(order)
    const workshop = workshopRepository.getByCode(tracking.operations[0]?.workshopCode ?? '')
    const line = productionLineRepository.getById(tracking.operations[0]?.lineId ?? '')
    const planned = order.production.plannedQty
    const produced = order.production.producedQty
    return {
      id: order.id,
      productionOrderNo: order.production.workOrderNo,
      salesOrderNo: order.orderNo,
      progress: order.production.progress,
      remainingQty: Math.max(0, planned - produced - order.production.wasteQty),
      terminRisk: order.terminRisk,
      workshop: workshop?.name ?? '—',
      lineCode: line?.code ?? '—',
    }
  })

  const lines = productionLineRepository.getActive().map((l) => {
    const records = SEWING_LINE_RECORDS.filter((s) => s.lineCode === l.code)
    const load = records.length
      ? Math.round(records.reduce((s, r) => s + (r.producedQty / r.plannedQty) * 100, 0) / records.length)
      : 0
    const eff = records.length ? Math.round(records.reduce((s, r) => s + r.efficiency, 0) / records.length) : 0
    return {
      code: l.code,
      loadPercent: load,
      efficiency: eff,
      activeOrders: [...new Set(records.map((r) => r.orderNo))],
    }
  })

  const workshops = workshopRepository.getActive().map((w) => {
    const assigned = orders.filter((o) => o.workshop === w.name).length
    return {
      code: w.code,
      name: w.name,
      utilizationPercent: Math.round((w.currentLoad / w.monthlyCapacity) * 100),
      freeCapacity: Math.max(0, w.monthlyCapacity - w.currentLoad),
      assignedOrders: assigned,
    }
  })

  const operationBottlenecks: ProductionPlanningBrainSnapshot['operationBottlenecks'] = []
  for (const order of activeOrders.filter((o) => o.productionStatus === 'Üretimde').slice(0, 10)) {
    const tracking = buildProductionTracking(order)
    for (const op of tracking.operations.filter((o) => o.progressPercent < 100)) {
      operationBottlenecks.push({
        operation: op.operationName,
        orderNo: order.orderNo,
        progress: op.progressPercent,
      })
    }
  }
  operationBottlenecks.sort((a, b) => a.progress - b.progress)

  const fire = orders.reduce((s, o) => {
    const ord = SALES_ORDERS.find((x) => x.id === o.id)
    return s + (ord?.production.wasteQty ?? 0)
  }, 0)
  const rework = activeOrders.reduce((s, o) => s + o.production.reworkQty, 0)
  const secondQuality = activeOrders.reduce((s, o) => s + o.production.secondQualityQty, 0)

  void output
  void OPERATIONAL_DASHBOARD

  return {
    orderCount: orders.length,
    terminRiskCount: orders.filter((o) => o.terminRisk).length,
    busyLineCount: lines.filter((l) => l.loadPercent >= 90).length,
    orders,
    lines,
    workshops,
    operationBottlenecks: operationBottlenecks.slice(0, 5),
    wasteSummary: { fire, rework, secondQuality },
  }
}

export function explainLineDelay(lineCode: string): string {
  const snapshot = buildProductionPlanningBrainSnapshot()
  const line = snapshot.lines.find((l) => l.code === lineCode) ?? snapshot.lines.sort((a, b) => b.loadPercent - a.loadPercent)[0]
  if (!line) return 'Hat verisi bulunamadı'
  return `Hat ${line.code} yük %${line.loadPercent}, verim %${line.efficiency}, aktif: ${line.activeOrders.join(', ') || '—'}`
}

export function getMostEfficientWorkshop(): string {
  const snapshot = buildProductionPlanningBrainSnapshot()
  const ws = [...snapshot.workshops].sort((a, b) => a.utilizationPercent - b.utilizationPercent)[0]
  return ws ? `${ws.name} — boş kapasite ${ws.freeCapacity}, doluluk %${ws.utilizationPercent}` : 'Veri yok'
}

export function getTerminRiskOrders(limit = 5) {
  return buildProductionPlanningBrainSnapshot().orders.filter((o) => o.terminRisk).slice(0, limit)
}
