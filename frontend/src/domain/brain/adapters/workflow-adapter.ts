import { OPERATIONAL_DASHBOARD } from '../../data/workflows'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const workflowAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'WORKFLOW',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const ops = OPERATIONAL_DASHBOARD

    return {
      sourceId: 'WORKFLOW',
      fetchedAt: new Date().toISOString(),
      entityKeys: [
        ...ops.todayCutting.map((i) => i.orderNo),
        ...ops.terminRisk.map((i) => i.orderNo),
      ],
      summary: `${ops.terminRisk.length} termin riski, ${ops.criticalFabrics.length} kritik kumaş`,
      recordCount:
        ops.todayCutting.length +
        ops.todaySewing.length +
        ops.terminRisk.length +
        ops.criticalFabrics.length,
      payload: {
        todayCutting: ops.todayCutting.length,
        todaySewing: ops.todaySewing.length,
        todayShipping: ops.todayShipping.length,
        terminRisk: ops.terminRisk,
        criticalFabrics: ops.criticalFabrics,
        criticalAccessories: ops.criticalAccessories,
        delayedPurchases: ops.delayedPurchases,
      },
    }
  },
}
