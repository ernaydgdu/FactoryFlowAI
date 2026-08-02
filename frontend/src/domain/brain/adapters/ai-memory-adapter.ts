import { getAllAiMemory, getRecentAiMemory } from '../../platform/services/ai-memory-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const aiMemoryAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'AI_MEMORY',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const entityId = context.scope.entityId ?? context.scope.orderId
    const entries = entityId
      ? getAllAiMemory().filter((e) => e.entityId === entityId)
      : getRecentAiMemory(30)

    return {
      sourceId: 'AI_MEMORY',
      fetchedAt: new Date().toISOString(),
      entityKeys: [...new Set(entries.map((e) => e.entityId))],
      summary: `${entries.length} AI memory kaydı (read-only)`,
      recordCount: entries.length,
      payload: {
        entries: entries.map((e) => ({
          id: e.id,
          category: e.category,
          entityId: e.entityId,
          entityNo: e.entityNo,
          summary: e.summary,
          importance: e.importance,
          eventType: e.eventType,
          timestamp: e.timestamp,
        })),
        note: 'Brain yalnızca AI Memory okur; yazma yapmaz',
      },
    }
  },
}
