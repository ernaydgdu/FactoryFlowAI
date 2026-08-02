/**
 * Resource Graph — sipariş kaynak zinciri (Order → Customer).
 */
import type { FactoryGraph } from '../types'
import type { ResourceGraph, ResourceGraphNodeType } from '../types'

const RESOURCE_CHAIN: ResourceGraphNodeType[] = [
  'ORDER',
  'PRODUCT',
  'BOM',
  'OPERATION',
  'MACHINE',
  'OPERATOR',
  'PRODUCTION_LINE',
  'WORKSHOP',
  'WAREHOUSE',
  'CONTAINER',
  'CUSTOMER',
]

const TYPE_MAP: Record<ResourceGraphNodeType, FactoryGraph['nodes'][0]['type']> = {
  ORDER: 'ORDER',
  PRODUCT: 'PRODUCT',
  BOM: 'BOM',
  OPERATION: 'OPERATION',
  MACHINE: 'MACHINE',
  OPERATOR: 'OPERATOR',
  PRODUCTION_LINE: 'PRODUCTION_LINE',
  WORKSHOP: 'WORKSHOP',
  WAREHOUSE: 'WAREHOUSE',
  CONTAINER: 'CONTAINER',
  CUSTOMER: 'CUSTOMER',
}

let resourceGraphCounter = 0

export function buildResourceGraph(
  factoryGraph: FactoryGraph,
  rootOrderId?: string,
): ResourceGraph {
  resourceGraphCounter += 1

  const orderNode = rootOrderId
    ? factoryGraph.nodes.find((n) => n.type === 'ORDER' && n.entityId === rootOrderId)
    : factoryGraph.nodes.find((n) => n.type === 'ORDER')

  const nodes: FactoryGraph['nodes'] = []
  const edges: FactoryGraph['edges'] = []

  if (orderNode) {
    for (const step of RESOURCE_CHAIN) {
      const factoryType = TYPE_MAP[step]
      if (step === 'CONTAINER') {
        nodes.push({
          id: `container-${orderNode.entityId}`,
          type: 'CONTAINER',
          label: 'Konteyner Plan',
          entityId: `cnt-${orderNode.entityId}`,
          sourceId: 'WORKFLOW',
          attributes: { planned: true },
          dataQuality: 'PARTIAL',
        })
        continue
      }
      const matched = factoryGraph.nodes.filter((n) => n.type === factoryType)
      if (step === 'ORDER') {
        nodes.push(orderNode)
      } else if (matched.length > 0) {
        nodes.push(matched[0])
      }
    }

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i]
      const to = nodes[i + 1]
      if (from && to) {
        edges.push({
          id: `rge-${i}`,
          fromNodeId: from.id,
          toNodeId: to.id,
          relationship: 'USES',
          sourceId: from.sourceId,
        })
      }
    }
  }

  return {
    graphId: `rgraph-${resourceGraphCounter}`,
    rootOrderId: orderNode?.entityId,
    chain: RESOURCE_CHAIN,
    nodes,
    edges,
    assembledAt: new Date().toISOString(),
    sideEffects: 'NONE',
  }
}
