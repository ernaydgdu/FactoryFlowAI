/**
 * Application-layer catalog bridge — domain/data yalnızca burada okunur.
 * Domain command path persistence port veya command context kullanır.
 */
import { getProductById } from '@/domain/data/products'
import { getSalesOrderById } from '@/domain/data/orders'
import { getStockCardById } from '@/domain/data/stock-cards'
import type {
  CreateBundlesCommandContext,
  CreateProductionOrderCommandContext,
  ProductionOrderReservationContext,
  ProductCardCommandContext,
  SalesOrderCommandContext,
  StockCardCommandContext,
} from '@/domain/catalog/command-context.types'
import type { SalesOrder } from '@/domain/types'

function mapSalesOrder(order: SalesOrder): SalesOrderCommandContext {
  return {
    id: order.id,
    orderNo: order.orderNo,
    productCardId: order.productCardId,
    general: order.general,
    matrix: order.matrix,
    matrixTotals: order.matrixTotals,
    production: order.production,
    exfDate: order.exfDate,
    terminRisk: order.terminRisk,
  }
}

function mapProduct(productId: string): ProductCardCommandContext {
  const product = getProductById(productId)
  if (!product) throw new Error(`Ürün bulunamadı: ${productId}`)
  return {
    id: product.id,
    productCode: product.productCode,
    productName: product.productName,
    buyer: product.buyer,
    bom: product.bom,
  }
}

function buildStockCardMap(product: ProductCardCommandContext): Map<string, StockCardCommandContext> {
  const map = new Map<string, StockCardCommandContext>()
  for (const line of product.bom) {
    const sc = getStockCardById(line.stockCardId)
    if (sc) {
      map.set(sc.id, {
        id: sc.id,
        code: sc.code,
        name: sc.name,
        unit: sc.unit,
        warehouseCode: sc.warehouseCode,
      })
    }
  }
  return map
}

export function buildCreateProductionOrderContext(salesOrderId: string): CreateProductionOrderCommandContext {
  const order = getSalesOrderById(salesOrderId)
  if (!order) throw new Error(`Sipariş bulunamadı: ${salesOrderId}`)
  const product = mapProduct(order.productCardId)
  return {
    salesOrder: mapSalesOrder(order),
    product,
    stockCardsById: buildStockCardMap(product),
  }
}

export function buildProductionOrderReservationContext(
  salesOrderId: string,
  productCardId: string,
): ProductionOrderReservationContext {
  const order = getSalesOrderById(salesOrderId)
  if (!order) throw new Error(`Sipariş bulunamadı: ${salesOrderId}`)
  const product = mapProduct(productCardId)
  return {
    salesOrder: mapSalesOrder(order),
    product,
    stockCardsById: buildStockCardMap(product),
  }
}

export function buildCreateBundlesContext(
  salesOrderId: string,
  productCode: string,
): CreateBundlesCommandContext {
  const order = getSalesOrderById(salesOrderId)
  if (!order) throw new Error(`Sipariş bulunamadı: ${salesOrderId}`)
  const product = mapProduct(order.productCardId)
  if (product.productCode !== productCode && productCode !== '—') {
    // productCode command input doğrulama — matrix order'dan gelir
  }
  return {
    salesOrder: mapSalesOrder(order),
    product,
    orderMatrix: order.matrix,
  }
}

export function resolveSalesOrderForSeed(order: SalesOrder): SalesOrderCommandContext {
  return mapSalesOrder(order)
}

export function resolveProductForSeed(productId: string): ProductCardCommandContext {
  return mapProduct(productId)
}

export function resolveStockCard(stockCardId: string): StockCardCommandContext | undefined {
  const sc = getStockCardById(stockCardId)
  if (!sc) return undefined
  return {
    id: sc.id,
    code: sc.code,
    name: sc.name,
    unit: sc.unit,
    warehouseCode: sc.warehouseCode,
  }
}
