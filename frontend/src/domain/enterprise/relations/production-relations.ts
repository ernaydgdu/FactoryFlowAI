/**
 * Production Order enterprise relations
 */
import { SALES_ORDERS } from '../../data/orders'
import { buildProductionTracking } from '../../services/textile/production-tracking-service'
import { operationRepository, productionLineRepository, workshopRepository } from '../../master-data'
import type { EntityRelation, ProductionOrderRelations } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-po-${fromId}-${toType}-${toId}`, fromType: 'PRODUCTION_ORDER', fromId, toType, toId, kind, label }
}

export function buildProductionOrderRelations(orderId: string): ProductionOrderRelations | undefined {
  const order = SALES_ORDERS.find((o) => o.id === orderId)
  if (!order) return undefined

  const poId = order.production.workOrderNo
  const tracking = buildProductionTracking(order)
  const workshopCode = tracking.operations[0]?.workshopCode ?? 'WSH-A'
  const workshop = workshopRepository.getByCode(workshopCode)
  const relations: EntityRelation[] = []

  for (const op of tracking.operations) {
    const opMaster = operationRepository.getByCode(op.operationCode)
    if (opMaster) relations.push(rel(poId, 'OPERATION', opMaster.id, 'ROUTES_TO', op.operationName))
  }

  if (workshop) {
    relations.push(rel(poId, 'WORKSHOP', workshop.id, 'ASSIGNED_TO', workshop.name))
    const line = productionLineRepository.getActive()[0]
    if (line) relations.push(rel(poId, 'PRODUCTION_LINE', line.id, 'USES', line.name))
    relations.push(rel(poId, 'MACHINE', 'mc-flat-1', 'USES', 'Machine'))
    relations.push(rel(poId, 'OPERATOR', 'emp-ayse', 'ASSIGNED_TO', 'Operator'))
  }

  relations.push(rel(poId, 'PRODUCTION_ORDER', `${poId}-bundle`, 'CONTAINS', 'Bundle'))
  relations.push(rel(poId, 'INSPECTION', `${poId}-qc`, 'INSPECTS', 'Quality'))
  relations.push(rel(poId, 'PRODUCTION_ORDER', `${poId}-rework`, 'REFERENCES', 'Rework'))
  relations.push(rel(poId, 'PRODUCTION_ORDER', `${poId}-scrap`, 'REFERENCES', 'Scrap'))
  relations.push(rel(poId, 'WAREHOUSE', 'wh-mml', 'PRODUCES', 'Finished Goods'))

  return {
    rootType: 'PRODUCTION_ORDER',
    rootId: poId,
    rootCode: poId,
    rootLabel: poId,
    relations,
    maxDepth: 3,
    operationIds: tracking.operations.map((o) => operationRepository.getByCode(o.operationCode)?.id ?? o.operationCode),
    workshopId: workshop?.id ?? 'wsh-a',
    lineId: productionLineRepository.getActive()[0]?.id,
  }
}

export function buildAllProductionOrderRelations(): ProductionOrderRelations[] {
  return SALES_ORDERS.slice(0, 10).map((o) => buildProductionOrderRelations(o.id)).filter((b): b is ProductionOrderRelations => !!b)
}
