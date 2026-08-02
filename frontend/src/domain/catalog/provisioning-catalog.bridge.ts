/**
 * Provisioning catalog bridge — yalnızca command-triggered provisioning için.
 * domain/data import'ları bu dosyada izole; command servisleri doğrudan import etmez.
 */
import { getSalesOrderById } from '../data/orders'
import { getProductById } from '../data/products'
import type { CreateBundlesCommandContext } from './command-context.types'

export function resolveCreateBundlesContextForProvisioning(
  salesOrderId: string,
  _productCode: string,
): CreateBundlesCommandContext {
  const order = getSalesOrderById(salesOrderId)
  if (!order) throw new Error(`Sipariş bulunamadı: ${salesOrderId}`)
  const product = getProductById(order.productCardId)
  if (!product) throw new Error(`Ürün bulunamadı: ${order.productCardId}`)
  return {
    salesOrder: {
      id: order.id,
      orderNo: order.orderNo,
      productCardId: order.productCardId,
      general: order.general,
      matrix: order.matrix,
      matrixTotals: order.matrixTotals,
      production: order.production,
      exfDate: order.exfDate,
      terminRisk: order.terminRisk,
    },
    product: {
      id: product.id,
      productCode: product.productCode,
      productName: product.productName,
      buyer: product.buyer,
      bom: product.bom,
    },
    orderMatrix: order.matrix,
  }
}

export function resolveCreateBundlesContextFromCommand(
  salesOrderId: string,
  productCode: string,
): CreateBundlesCommandContext {
  return resolveCreateBundlesContextForProvisioning(salesOrderId, productCode)
}
