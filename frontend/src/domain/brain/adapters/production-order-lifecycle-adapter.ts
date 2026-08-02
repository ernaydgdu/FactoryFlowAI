/**
 * Production Order Lifecycle Brain Adapter — READ ONLY
 */
import {
  analyzeProductionOrderForBrain,
  getProductionOrderLifecycleBrainSummary,
} from '../../production-order/lifecycle-brain-query'
import { getAllProductionOrderLifecycles } from '../../production-order/lifecycle-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const productionOrderLifecycleAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'PRODUCTION_ORDER_LIFECYCLE',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const summary = getProductionOrderLifecycleBrainSummary()
    const orders = getAllProductionOrderLifecycles()
    const scopedNo =
      context.scope.entityType === 'ProductionOrder'
        ? context.scope.entityId ?? context.scope.orderNo
        : context.scope.orderNo
    const insight = scopedNo ? analyzeProductionOrderForBrain(scopedNo) : null

    return {
      sourceId: 'PRODUCTION_ORDER_LIFECYCLE',
      fetchedAt: new Date().toISOString(),
      entityKeys: orders.map((o) => o.productionOrderNo),
      summary: `${summary.total} UE, ${summary.inProduction} üretimde, ${summary.terminRisk} termin riski`,
      recordCount: orders.length,
      payload: {
        summary,
        scopedInsight: insight,
        faq: insight
          ? {
              whyDelayed: insight.whyDelayed,
              biggestBottleneck: insight.biggestBottleneck,
              waitingOperation: insight.waitingOperation,
              capacitySufficient: insight.capacitySufficient,
              terminRisk: insight.terminRisk,
              bestWorkshop: insight.bestWorkshop,
            }
          : null,
        note: 'Production Order Lifecycle — READ ONLY analiz',
      },
    }
  },
}
