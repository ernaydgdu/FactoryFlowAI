/** Enterprise Relation Graph — build cache */

import type { EnterpriseRelationGraph } from '../enterprise/types'

let cachedGraph: EnterpriseRelationGraph | null = null
let cachedAt = 0
const TTL_MS = 60_000

export function getCachedEnterpriseGraph(): EnterpriseRelationGraph | null {
  if (!cachedGraph || Date.now() - cachedAt > TTL_MS) return null
  return cachedGraph
}

export function setCachedEnterpriseGraph(graph: EnterpriseRelationGraph): void {
  cachedGraph = graph
  cachedAt = Date.now()
}

export function invalidateEnterpriseGraphCache(): void {
  cachedGraph = null
  cachedAt = 0
}
