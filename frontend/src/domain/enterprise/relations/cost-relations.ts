/**
 * Cost Sheet enterprise relations
 */
import { SALES_ORDERS } from '../../data/orders'
import { calculateTextileCostBreakdown } from '../../services/textile/textile-costing-service'
import type { EntityRelation, CostSheetRelations } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-cost-${fromId}-${toType}-${toId}`, fromType: 'COST_SHEET', fromId, toType, toId, kind, label }
}

export function buildCostSheetRelations(orderId: string): CostSheetRelations | undefined {
  const order = SALES_ORDERS.find((o) => o.id === orderId)
  if (!order) return undefined

  const cost = calculateTextileCostBreakdown(order)
  const costId = `cost-${orderId}`
  const relations: EntityRelation[] = []

  for (const item of cost.structure) {
    relations.push(rel(costId, 'COST_SHEET', `${costId}-${item.key}`, 'HAS', item.label))
  }

  relations.push(rel(costId, 'COST_SHEET', `${costId}-scenario-1`, 'REFERENCES', 'Scenario History'))
  relations.push(rel(costId, 'SALES_ORDER', orderId, 'BELONGS_TO', order.orderNo))

  return {
    rootType: 'COST_SHEET',
    rootId: costId,
    rootCode: costId,
    rootLabel: `Cost ${order.orderNo}`,
    relations,
    maxDepth: 2,
    orderId,
    scenarioHistoryIds: [`${costId}-scenario-1`],
  }
}

export function buildAllCostSheetRelations(): CostSheetRelations[] {
  return SALES_ORDERS.slice(0, 10).map((o) => buildCostSheetRelations(o.id)).filter((b): b is CostSheetRelations => !!b)
}
