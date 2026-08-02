/**
 * Purchasing enterprise relation chain
 */
import { SALES_ORDERS } from '../../data/orders'
import { traceAllMaterialChains } from '../../services/textile/purchase-chain-service'
import { DEMO_STOCK_LEDGER } from '../../data/stock-ledger-demo'
import { supplierRepository } from '../../master-data'
import type { EntityRelation, EntityRelationBundle } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-pur-${fromId}-${toType}-${toId}`, fromType: 'PURCHASE_ORDER', fromId, toType, toId, kind, label }
}

export function buildPurchasingRelations(orderId: string): EntityRelationBundle | undefined {
  const order = SALES_ORDERS.find((o) => o.id === orderId)
  if (!order) return undefined

  const chains = traceAllMaterialChains(order, DEMO_STOCK_LEDGER)
  const relations: EntityRelation[] = []
  const prId = `pr-${orderId}`

  relations.push(rel(prId, 'PURCHASE_REQUEST', prId, 'DERIVED_FROM', 'Purchase Request'))
  relations.push(rel(prId, 'PURCHASE_ORDER', `po-${orderId}`, 'FOLLOWS', 'Purchase Order'))
  relations.push(rel(`po-${orderId}`, 'SUPPLIER', supplierRepository.getActive()[0]?.id ?? 'sup-bos', 'SUPPLIES', 'Supplier'))
  relations.push(rel(`po-${orderId}`, 'INSPECTION', `insp-po-${orderId}`, 'INSPECTS', 'Inspection'))
  relations.push(rel(`po-${orderId}`, 'WAREHOUSE', 'wh-kms', 'STORED_IN', 'Warehouse Receipt'))
  relations.push(rel(`po-${orderId}`, 'STOCK_LOT', `res-${orderId}`, 'REFERENCES', 'Reservation'))
  relations.push(rel(`po-${orderId}`, 'STOCK_LOT', `cons-${orderId}`, 'CONSUMES', 'Consumption'))

  for (const chain of chains.slice(0, 2)) {
    for (const link of chain.links) {
      relations.push(rel(`po-${orderId}`, 'PURCHASE_ORDER', `${orderId}-${link.stage}`, 'FOLLOWS', link.stage))
    }
  }

  return {
    rootType: 'PURCHASE_ORDER',
    rootId: `po-${orderId}`,
    rootCode: `PO-${order.orderNo}`,
    rootLabel: `Purchase Chain ${order.orderNo}`,
    relations,
    maxDepth: 4,
  }
}

export function buildAllPurchasingRelations(): EntityRelationBundle[] {
  return SALES_ORDERS.slice(0, 5).map((o) => buildPurchasingRelations(o.id)).filter((b): b is EntityRelationBundle => !!b)
}
