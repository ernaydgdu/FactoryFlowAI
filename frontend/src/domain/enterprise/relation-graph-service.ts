/**
 * Enterprise Relation Graph — tüm entity ilişkilerini graph olarak birleştirir
 */
import type {
  EnterpriseRelationGraph,
  EnterpriseRelationGraphEdge,
  EnterpriseRelationGraphNode,
  EntityRelationBundle,
} from './types'
import { buildAllProductCardRelations } from './relations/product-card-relations'
import { buildAllSalesOrderRelations, buildSalesOrderRelations } from './relations/sales-order-relations'
import { buildAllFabricCardRelations } from './relations/fabric-card-relations'
import { buildAllAccessoryCardRelations } from './relations/accessory-card-relations'
import { buildAllWarehouseRelations } from './relations/warehouse-relations'
import { buildAllProductionOrderRelations, buildProductionOrderRelations } from './relations/production-relations'
import { buildAllPurchasingRelations, buildPurchasingRelations } from './relations/purchasing-relations'
import { buildAllQualityRelations } from './relations/quality-relations'
import { buildAllCostSheetRelations, buildCostSheetRelations } from './relations/cost-relations'
import { buildProductCardRelations } from './relations/product-card-relations'
import { getCachedEnterpriseGraph, setCachedEnterpriseGraph } from '../performance/relation-graph-cache'

let graphCounter = 0

function nodeId(type: string, id: string): string {
  return `${type}:${id}`
}

function bundlesToGraph(bundles: EntityRelationBundle[]): EnterpriseRelationGraph {
  graphCounter += 1
  const nodeMap = new Map<string, EnterpriseRelationGraphNode>()
  const edges: EnterpriseRelationGraphEdge[] = []
  let edgeCounter = 0

  for (const bundle of bundles) {
    const rootNodeId = nodeId(bundle.rootType, bundle.rootId)
    if (!nodeMap.has(rootNodeId)) {
      nodeMap.set(rootNodeId, {
        id: rootNodeId,
        entityType: bundle.rootType,
        entityId: bundle.rootId,
        label: bundle.rootLabel,
        code: bundle.rootCode,
      })
    }

    for (const r of bundle.relations) {
      const fromNodeId = nodeId(r.fromType, r.fromId)
      const toNodeId = nodeId(r.toType, r.toId)

      if (!nodeMap.has(fromNodeId)) {
        nodeMap.set(fromNodeId, { id: fromNodeId, entityType: r.fromType, entityId: r.fromId, label: r.fromId })
      }
      if (!nodeMap.has(toNodeId)) {
        nodeMap.set(toNodeId, { id: toNodeId, entityType: r.toType, entityId: r.toId, label: r.toId })
      }

      edgeCounter += 1
      edges.push({
        id: `erg-e-${edgeCounter}`,
        fromNodeId,
        toNodeId,
        kind: r.kind,
        label: r.label,
      })
    }
  }

  const depths = bundles.map((b) => b.maxDepth)
  const averageDepth = depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0

  return {
    graphId: `erg-${graphCounter}`,
    assembledAt: new Date().toISOString(),
    nodes: [...nodeMap.values()],
    edges,
    nodeCount: nodeMap.size,
    edgeCount: edges.length,
    averageDepth,
    bundles,
    sideEffects: 'NONE',
  }
}

export function buildEnterpriseRelationGraph(): EnterpriseRelationGraph {
  const cached = getCachedEnterpriseGraph()
  if (cached) return cached

  const bundles: EntityRelationBundle[] = [
    ...buildAllProductCardRelations(),
    ...buildAllSalesOrderRelations(),
    ...buildAllFabricCardRelations(),
    ...buildAllAccessoryCardRelations(),
    ...buildAllWarehouseRelations(),
    ...buildAllProductionOrderRelations(),
    ...buildAllPurchasingRelations(),
    ...buildAllQualityRelations(),
    ...buildAllCostSheetRelations(),
  ]
  const graph = bundlesToGraph(bundles)
  setCachedEnterpriseGraph(graph)
  return graph
}

export function buildEnterpriseRelationGraphForOrder(orderId: string): EnterpriseRelationGraph {
  const bundles: EntityRelationBundle[] = []
  const orderBundle = buildSalesOrderRelations(orderId)
  if (orderBundle) {
    bundles.push(orderBundle)
    const pc = buildProductCardRelations(orderBundle.productCardId)
    if (pc) bundles.push(pc)
    const prod = buildProductionOrderRelations(orderId)
    if (prod) bundles.push(prod)
    const pur = buildPurchasingRelations(orderId)
    if (pur) bundles.push(pur)
    const cost = buildCostSheetRelations(orderId)
    if (cost) bundles.push(cost)
  }
  return bundlesToGraph(bundles)
}

export function getRelationCount(): number {
  return buildEnterpriseRelationGraph().edgeCount
}

export function getEntityCount(): number {
  return buildEnterpriseRelationGraph().nodeCount
}

export function mergeEnterpriseGraphIntoFactoryGraph(
  factoryNodes: Array<{ id: string; entityId: string; type: string }>,
  factoryEdges: Array<{ fromNodeId: string; toNodeId: string; relationship: string; label?: string }>,
): { additionalNodes: number; additionalEdges: number } {
  const graph = buildEnterpriseRelationGraph()
  let additionalNodes = 0
  let additionalEdges = 0

  for (const n of graph.nodes) {
    if (!factoryNodes.find((fn) => fn.entityId === n.entityId)) additionalNodes += 1
  }
  additionalEdges = graph.edgeCount

  void factoryEdges
  return { additionalNodes, additionalEdges }
}
