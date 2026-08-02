/**
 * Sales Order enterprise relation chain
 */
import { SALES_ORDERS } from '../../data/orders'
import { getTextileProductById } from '../../data/products'
import type { EntityRelation, SalesOrderRelationChain } from '../types'

function rel(
  fromId: string,
  toType: EntityRelation['toType'],
  toId: string,
  kind: EntityRelation['kind'],
  label: string,
): EntityRelation {
  return {
    id: `rel-so-${fromId}-${toType}-${toId}`,
    fromType: 'SALES_ORDER',
    fromId,
    toType,
    toId,
    kind,
    label,
  }
}

export function buildSalesOrderRelations(orderId: string): SalesOrderRelationChain | undefined {
  const order = SALES_ORDERS.find((o) => o.id === orderId)
  if (!order) return undefined

  const product = getTextileProductById(order.productCardId)
  const relations: EntityRelation[] = []

  relations.push(rel(orderId, 'CUSTOMER', product?.refs.customerId ?? 'cus-lcw', 'BELONGS_TO', 'Customer'))
  relations.push(rel(orderId, 'BRAND', product?.refs.brandId ?? 'brd-lcw', 'BELONGS_TO', 'Brand'))
  relations.push(rel(orderId, 'BUYER', product?.refs.buyerId ?? 'buy-buy-sm', 'BELONGS_TO', 'Buyer'))
  relations.push(rel(orderId, 'MERCHANDISER', product?.refs.merchandiserId ?? 'mer-za', 'BELONGS_TO', 'Merchandiser'))
  relations.push(rel(orderId, 'PRODUCT_CARD', order.productCardId, 'USES', 'Product Card'))
  relations.push(rel(orderId, 'SIZE_SET', product?.refs.sizeSetId ?? 'ss-tshirt', 'HAS', 'Size Matrix'))
  relations.push(rel(orderId, 'COLOR_CARD', product?.colorAssignments[0]?.colorCardId ?? 'clr-black', 'HAS', 'Color Matrix'))
  relations.push(rel(orderId, 'BOM', product?.bom.id ?? `bom-${order.productCardId}`, 'SNAPSHOT_OF', 'BOM Snapshot'))
  relations.push(rel(orderId, 'COST_SHEET', `cost-${orderId}`, 'SNAPSHOT_OF', 'Cost Snapshot'))
  relations.push(rel(orderId, 'PRODUCTION_ORDER', order.production.workOrderNo, 'TRIGGERS', 'Planning Snapshot'))
  relations.push(rel(orderId, 'PRODUCTION_ORDER', order.production.workOrderNo, 'PRODUCES', 'Production Order'))

  if (order.productionStatus === 'Sevk Edildi' || order.productionStatus === 'Tamamlandı') {
    relations.push(rel(orderId, 'SHIPMENT', `shp-${orderId}`, 'FOLLOWS', 'Shipment'))
    relations.push(rel(orderId, 'INVOICE', `inv-${orderId}`, 'FOLLOWS', 'Invoice'))
  }

  return {
    rootType: 'SALES_ORDER',
    rootId: orderId,
    rootCode: order.orderNo,
    rootLabel: order.orderNo,
    relations,
    maxDepth: 4,
    customerId: product?.refs.customerId ?? 'cus-lcw',
    productCardId: order.productCardId,
    productionOrderId: order.production.workOrderNo,
    shipmentId: order.productionStatus === 'Sevk Edildi' ? `shp-${orderId}` : undefined,
    invoiceId: order.productionStatus === 'Sevk Edildi' ? `inv-${orderId}` : undefined,
  }
}

export function buildAllSalesOrderRelations(): SalesOrderRelationChain[] {
  return SALES_ORDERS.map((o) => buildSalesOrderRelations(o.id)).filter((b): b is SalesOrderRelationChain => !!b)
}
