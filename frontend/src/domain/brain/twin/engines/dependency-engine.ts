/**
 * Dependency Engine — siparişler arası bağımlılık ağı.
 */
import { SALES_ORDERS } from '../../../data/orders'
import { getProductById } from '../../../data/products'
import type { DependencyEdge, DependencyGraph } from '../types'

let depGraphCounter = 0

export function buildDependencyGraph(orderIds?: string[]): DependencyGraph {
  depGraphCounter += 1
  const orders = orderIds
    ? SALES_ORDERS.filter((o) => orderIds.includes(o.id))
    : SALES_ORDERS.slice(0, 15)

  const edges: DependencyEdge[] = []
  let edgeCounter = 0

  const materialMap = new Map<string, string[]>()
  const workshopMap = new Map<string, string[]>()

  for (const order of orders) {
    const product = getProductById(order.productCardId)
    if (!product) continue

    for (const bomLine of product.bom) {
      const key = bomLine.stockCardId
      const list = materialMap.get(key) ?? []
      list.push(order.id)
      materialMap.set(key, list)
    }

    const workshop = order.general.factory
    const wList = workshopMap.get(workshop) ?? []
    wList.push(order.id)
    workshopMap.set(workshop, wList)
  }

  for (const [materialId, orderList] of materialMap) {
    if (orderList.length < 2) continue
    for (let i = 0; i < orderList.length - 1; i++) {
      for (let j = i + 1; j < orderList.length; j++) {
        edgeCounter += 1
        edges.push({
          id: `dep-${edgeCounter}`,
          type: 'SHARED_MATERIAL',
          fromOrderId: orderList[i],
          toOrderId: orderList[j],
          sharedResourceId: materialId,
          sharedResourceLabel: materialId,
          impactDescription: 'Ortak kumaş/aksesuar kullanımı — stok rekabeti',
        })
      }
    }
  }

  for (const [workshop, orderList] of workshopMap) {
    if (orderList.length < 2) continue
    edgeCounter += 1
    edges.push({
      id: `dep-${edgeCounter}`,
      type: 'SHARED_WORKSHOP',
      fromOrderId: orderList[0],
      toOrderId: orderList[1],
      sharedResourceId: workshop,
      sharedResourceLabel: workshop,
      impactDescription: 'Ortak atölye kapasitesi — termin etkileşimi',
    })
  }

  const sharedResources = [
    ...[...materialMap.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([resourceId, orderIds]) => ({
        resourceId,
        label: resourceId,
        orderIds,
      })),
    ...[...workshopMap.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([resourceId, orderIds]) => ({
        resourceId,
        label: resourceId,
        orderIds,
      })),
  ]

  return {
    graphId: `dgraph-${depGraphCounter}`,
    edges,
    sharedResources,
    generatedAt: new Date().toISOString(),
  }
}
