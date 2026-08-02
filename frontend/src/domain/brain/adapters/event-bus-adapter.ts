import { getAllEvents, getEvents } from '../../platform/services/event-bus'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const eventBusAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'EVENT_BUS',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const orderId = context.scope.orderId
    const events = orderId
      ? getEvents({ aggregateType: 'SalesOrder', aggregateId: orderId })
      : getAllEvents()

    return {
      sourceId: 'EVENT_BUS',
      fetchedAt: new Date().toISOString(),
      entityKeys: [...new Set(events.map((e) => e.aggregateId))],
      summary: `${events.length} domain event`,
      recordCount: events.length,
      payload: {
        events: events.slice(-30).map((e) => ({
          id: e.id,
          type: e.type,
          aggregateType: e.aggregateType,
          aggregateId: e.aggregateId,
          aggregateNo: e.aggregateNo,
          occurredAt: e.occurredAt,
          causedBy: e.causedBy,
        })),
      },
    }
  },
}
