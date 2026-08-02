import { getDashboardKpis } from '../../platform/services/kpi-engine'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const kpiEngineAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'KPI_ENGINE',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const { snapshot, details } = getDashboardKpis()

    return {
      sourceId: 'KPI_ENGINE',
      fetchedAt: new Date().toISOString(),
      entityKeys: ['kpi-snapshot'],
      summary: `${snapshot.activeOrders} aktif sipariş, ${snapshot.terminRiskCount} termin riski`,
      recordCount: details.length,
      payload: { snapshot, details },
    }
  },
}
