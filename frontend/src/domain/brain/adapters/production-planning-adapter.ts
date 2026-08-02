/**
 * Production Planning Brain Adapter — READ ONLY (domain query)
 */
import {
  buildProductionPlanningBrainSnapshot,
  explainLineDelay,
  getMostEfficientWorkshop,
  getTerminRiskOrders,
} from '../../production-planning/production-planning-query'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const productionPlanningAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'PRODUCTION_PLANNING',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const snapshot = buildProductionPlanningBrainSnapshot()
    const line3 = snapshot.lines.find((l) => l.code.includes('3') || l.code === 'LINE-3')

    return {
      sourceId: 'PRODUCTION_PLANNING',
      fetchedAt: new Date().toISOString(),
      entityKeys: snapshot.orders.map((o) => o.id),
      summary: `${snapshot.orderCount} UE, ${snapshot.terminRiskCount} termin riski, ${snapshot.busyLineCount} yoğun hat`,
      recordCount: snapshot.orders.length,
      payload: {
        insights: {
          whyLine3Delayed: line3 ? explainLineDelay(line3.code) : explainLineDelay('LINE-3'),
          mostEfficientWorkshop: getMostEfficientWorkshop(),
          terminRiskOrders: getTerminRiskOrders(5),
        },
        snapshot,
        note: 'Production Planning — Planning Engine + tracking read-only',
      },
    }
  },
}
