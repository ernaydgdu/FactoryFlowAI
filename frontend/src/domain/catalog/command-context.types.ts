/**
 * Command context types — domain command path veri taşıyıcıları.
 * domain/data static import command path'te kullanılmaz; application katmanı doldurur.
 */
import type { ColorSizeMatrix, ProductCard, SalesOrder } from '../types'

export type SalesOrderCommandContext = Pick<
  SalesOrder,
  | 'id'
  | 'orderNo'
  | 'productCardId'
  | 'general'
  | 'matrix'
  | 'matrixTotals'
  | 'production'
  | 'exfDate'
  | 'terminRisk'
>

export type ProductCardCommandContext = Pick<
  ProductCard,
  'id' | 'productCode' | 'productName' | 'buyer' | 'bom'
>

export type StockCardCommandContext = {
  id: string
  code: string
  name: string
  unit: string
  warehouseCode?: string
}

export type CreateProductionOrderCommandContext = {
  salesOrder: SalesOrderCommandContext
  product: ProductCardCommandContext
  stockCardsById: Map<string, StockCardCommandContext>
}

export type CreateBundlesCommandContext = {
  salesOrder: SalesOrderCommandContext
  product: ProductCardCommandContext
  orderMatrix: ColorSizeMatrix
}

export type ProductionOrderReservationContext = {
  salesOrder: SalesOrderCommandContext
  product: ProductCardCommandContext
  stockCardsById: Map<string, StockCardCommandContext>
}
