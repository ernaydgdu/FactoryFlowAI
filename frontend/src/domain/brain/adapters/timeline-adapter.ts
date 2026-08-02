import { getAllTimelineEntries, getOrderTimeline } from '../../platform/services/timeline-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const timelineAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'TIMELINE',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const orderId = context.scope.orderId
    const entries = orderId ? getOrderTimeline(orderId) : getAllTimelineEntries()

    return {
      sourceId: 'TIMELINE',
      fetchedAt: new Date().toISOString(),
      entityKeys: [...new Set(entries.map((e) => e.orderId))],
      summary: `${entries.length} timeline kaydı`,
      recordCount: entries.length,
      payload: {
        entries: entries.slice(0, 50).map((e) => ({
          orderId: e.orderId,
          orderNo: e.orderNo,
          eventType: e.eventType,
          title: e.title,
          occurredAt: e.occurredAt,
          actor: e.actor,
        })),
      },
    }
  },
}
