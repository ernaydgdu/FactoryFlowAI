import type { PlanningEngineOutput, PlanningSnapshot } from '../types/planning'
import type { SalesOrder } from '../types'
import { allocateCapacity, allocateCapacitySplit, getWorkshopCapacitySnapshots } from './planning/capacity-engine'
import { calculateDetailedCost } from './planning/cost-engine'
import { consolidateMrp } from './planning/mrp-engine'
import { assessAllOrderRisks } from './planning/risk-engine'
import { calculateTerminPlans } from './planning/termin-engine'

const DEFAULT_REFERENCE = new Date('2026-08-02')

/**
 * Planning Engine — termin, kapasite, MRP, risk ve maliyet motorlarını
 * tek orchestrator'da birleştirir.
 */
export function runPlanningEngine(
  orders: SalesOrder[],
  referenceDate: Date = DEFAULT_REFERENCE,
): PlanningEngineOutput {
  const terminPlans = calculateTerminPlans(orders, referenceDate)

  const pendingAllocations = orders
    .filter((o) => o.productionStatus === 'Üretimde' || o.productionStatus === 'Beklemede')
    .map((o) => allocateCapacity(o.matrixTotals.grandTotal, undefined, o.id, o.orderNo))

  const workshopCapacities = getWorkshopCapacitySnapshots(undefined, pendingAllocations)
  const consolidatedMrp = consolidateMrp(orders, referenceDate)
  const riskAssessments = assessAllOrderRisks(orders, terminPlans, workshopCapacities)

  const snapshots: PlanningSnapshot[] = orders.map((order) => {
    const termin = terminPlans.find((t) => t.orderId === order.id)!
    const risk = riskAssessments.find((r) => r.orderId === order.id)!
    const cost = calculateDetailedCost(order)
    const capacity =
      order.productionStatus !== 'Sevk Edildi'
        ? order.isSplit && order.productionSplits?.length
          ? allocateCapacitySplit(
              order.matrixTotals.grandTotal,
              order.productionSplits.map((s) => s.workshopCode),
              order.id,
              order.orderNo,
            )
          : allocateCapacity(order.matrixTotals.grandTotal, undefined, order.id, order.orderNo)
        : undefined

    const splitCapacity =
      order.isSplit && order.productionSplits?.length
        ? allocateCapacitySplit(
            order.matrixTotals.grandTotal,
            order.productionSplits.map((s) => s.workshopCode),
            order.id,
            order.orderNo,
          )
        : undefined

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      quantity: order.matrixTotals.grandTotal,
      exfDate: order.general.exf,
      termin,
      risk,
      cost,
      capacity,
      splitCapacity,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    referenceDate: referenceDate.toISOString().slice(0, 10),
    terminPlans,
    workshopCapacities,
    consolidatedMrp,
    riskAssessments,
    snapshots,
  }
}

export function runPlanningEngineForOrder(
  order: SalesOrder,
  referenceDate?: Date,
): PlanningSnapshot {
  return runPlanningEngine([order], referenceDate).snapshots[0]
}
