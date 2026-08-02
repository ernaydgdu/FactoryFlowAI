/** Brain Knowledge Graph — snapshot cache (canlı domain gezinmez) */

import type { KnowledgeGraph } from '../brain/types/knowledge-reasoning'

const cache = new Map<string, { graph: KnowledgeGraph; cachedAt: number }>()
const TTL_MS = 5 * 60 * 1000

export function getCachedKnowledgeGraph(snapshotId: string): KnowledgeGraph | undefined {
  const entry = cache.get(snapshotId)
  if (!entry) return undefined
  if (Date.now() - entry.cachedAt > TTL_MS) {
    cache.delete(snapshotId)
    return undefined
  }
  return entry.graph
}

export function setCachedKnowledgeGraph(snapshotId: string, graph: KnowledgeGraph): void {
  cache.set(snapshotId, { graph, cachedAt: Date.now() })
}

export function invalidateKnowledgeGraphCache(snapshotId?: string): void {
  if (snapshotId) cache.delete(snapshotId)
  else cache.clear()
}

export function getKnowledgeGraphCacheSize(): number {
  return cache.size
}
