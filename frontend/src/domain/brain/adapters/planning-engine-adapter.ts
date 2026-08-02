import { SALES_ORDERS } from '../../data/orders'
import { runPlanningEngine, runPlanningEngineForOrder } from '../../services/planning-engine'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const planningEngineAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'PLANNING_ENGINE',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return SALES_ORDERS.length > 0
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const orderId = context.scope.orderId
    const order = orderId ? SALES_ORDERS.find((o) => o.id === orderId) : undefined

    const output =
      order != null
        ? { ...runPlanningEngine(SALES_ORDERS), snapshots: [runPlanningEngineForOrder(order)] }
        : runPlanningEngine(SALES_ORDERS)

    const snapshots = output.snapshots
    const riskCount = snapshots.filter((s) => s.risk.level !== 'Düşük').length

    return {
      sourceId: 'PLANNING_ENGINE',
      fetchedAt: new Date().toISOString(),
      entityKeys: snapshots.map((s) => s.orderId),
      summary: `${snapshots.length} sipariş planlama snapshot, ${riskCount} riskli`,
      recordCount: snapshots.length,
      payload: {
        referenceDate: output.referenceDate,
        terminPlans: snapshots.map((s) => ({
          orderId: s.orderId,
          orderNo: s.orderNo,
          exfDate: s.exfDate,
          terminStatus: s.termin.riskLevel,
          riskLevel: s.risk.level,
          riskScore: s.risk.score,
          capacityFullyAllocated: s.capacity?.fullyAllocated,
          unallocatedQty: s.capacity?.unallocatedQty,
          totalCost: s.cost.totalCost,
        })),
        note: 'Brain yalnızca planlama çıktısını okur; planlama motoru çalıştırmaz/değiştirmez',
      },
    }
  },
}
