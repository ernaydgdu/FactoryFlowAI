/**
 * Enterprise Relation Graph — Brain knowledge adapter (READ ONLY)
 */
import { buildEnterpriseRelationGraph } from '../../enterprise/relation-graph-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const enterpriseRelationAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'ENTERPRISE_RELATIONS',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const graph = buildEnterpriseRelationGraph()

    return {
      sourceId: 'ENTERPRISE_RELATIONS',
      fetchedAt: new Date().toISOString(),
      entityKeys: graph.nodes.slice(0, 50).map((n) => n.entityId),
      summary: `${graph.nodeCount} entity, ${graph.edgeCount} ilişki — Enterprise relation graph`,
      recordCount: graph.edgeCount,
      payload: {
        graphId: graph.graphId,
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
        averageDepth: graph.averageDepth,
        bundleCount: graph.bundles.length,
        readinessScore: Math.min(100, Math.round((graph.nodeCount / 150) * 100)),
        coverage: {
          knowledgeGraph: Math.min(100, Math.round((graph.nodeCount / 150) * 100)),
        },
        sampleEdges: graph.edges.slice(0, 20).map((e) => ({
          from: e.fromNodeId,
          to: e.toNodeId,
          kind: e.kind,
          label: e.label,
        })),
        note: 'Enterprise Domain Phase 3 — relation graph snapshot',
      },
    }
  },
}
