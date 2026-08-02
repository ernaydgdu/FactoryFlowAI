import { getRecentAiMemory, getAiTimeline } from '../../platform/services/ai-memory-service'
import type { BrainContext, BrainMemoryEntry, BrainSessionMemory } from '../types'
import type { MemoryLayerContract } from '../contracts'

const sessions = new Map<string, BrainSessionMemory>()
let memoryCounter = 0

export const memoryLayer: MemoryLayerContract = {
  getOrCreateSession(context: BrainContext): BrainSessionMemory {
    const existing = sessions.get(context.sessionId)
    if (existing) return existing

    const session: BrainSessionMemory = {
      sessionId: context.sessionId,
      companyId: context.companyId,
      userId: context.userId,
      startedAt: context.requestedAt,
      entries: [],
      analysisCount: 0,
      recommendationCount: 0,
      simulationCount: 0,
    }
    sessions.set(context.sessionId, session)
    return session
  },

  recordEntry(
    context: BrainContext,
    entry: Omit<BrainMemoryEntry, 'id' | 'sessionId' | 'companyId' | 'timestamp'>,
  ): BrainMemoryEntry {
    memoryCounter += 1
    const session = this.getOrCreateSession(context)
    const full: BrainMemoryEntry = {
      ...entry,
      id: `bmem-${memoryCounter}`,
      sessionId: context.sessionId,
      companyId: context.companyId,
      timestamp: new Date().toISOString(),
    }
    session.entries.push(full)

    if (entry.category === 'analysis') session.analysisCount += 1
    if (entry.category === 'recommendation') session.recommendationCount += 1
    if (entry.category === 'simulation') session.simulationCount += 1

    return full
  },

  getSessionHistory(sessionId: string): BrainMemoryEntry[] {
    return sessions.get(sessionId)?.entries ?? []
  },
}

/** Platform AI Memory ile read-only entegrasyon */
export function enrichMemoryFromPlatform(entityId?: string): BrainMemoryEntry[] {
  if (entityId) {
    const timeline = getAiTimeline(entityId)
    return timeline.entries.map((e) => ({
      id: e.id,
      sessionId: 'platform',
      companyId: 'platform',
      timestamp: e.timestamp,
      category: 'context' as const,
      summary: e.summary,
      entityId: e.entityId,
      entityNo: e.entityNo,
      importance: e.importance,
      tags: e.tags,
    }))
  }
  return getRecentAiMemory(20).map((e) => ({
    id: e.id,
    sessionId: 'platform',
    companyId: 'platform',
    timestamp: e.timestamp,
    category: 'context' as const,
    summary: e.summary,
    entityId: e.entityId,
    entityNo: e.entityNo,
    importance: e.importance,
    tags: e.tags,
  }))
}

export function clearBrainSessions(): void {
  sessions.clear()
}
