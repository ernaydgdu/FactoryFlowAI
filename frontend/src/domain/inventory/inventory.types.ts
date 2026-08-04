/**
 * Inventory domain types — warehouse operations & stock ledger references.
 */
import type { StockMovement, StockMovementType, StockReferenceType } from '@/domain/types/stock-ledger'

export type InventoryDomainErrorCode =
  | 'WAREHOUSE_NOT_FOUND'
  | 'STOCK_CARD_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_QUANTITY'

export type GoodsReceiptLedgerInput = {
  goodsReceiptId: string
  grNo: string
  purchaseOrderId: string
  poNo: string
  warehouseCode: string
  lines: { stockCardId: string; materialCode: string; quantity: number }[]
}

export type GoodsIssueInput = {
  stockCardId: string
  warehouseCode: string
  quantity: number
  referenceType: StockReferenceType
  referenceId: string
  referenceNo: string
  reason: string
}

export type StockTransferInput = {
  stockCardId: string
  quantity: number
  fromWarehouseCode: string
  toWarehouseCode: string
  referenceId: string
  referenceNo: string
  reason: string
}

export type StockReservationInput = {
  stockCardId: string
  warehouseCode: string
  quantity: number
  referenceType: StockReferenceType
  referenceId: string
  referenceNo: string
  reason: string
}

export type StockAdjustmentInput = {
  stockCardId: string
  warehouseCode: string
  quantity: number
  referenceId: string
  referenceNo: string
  reason: string
}

export type CycleCountInput = {
  stockCardId: string
  warehouseCode: string
  countedQty: number
  countNo: string
  reason?: string
}

export type FinishedGoodsReceiptInput = {
  productionOrderId: string
  productionOrderNo: string
  warehouseCode: string
  quantity: number
  reason?: string
}

export type WarehouseStockSummary = {
  warehouseCode: string
  itemCount: number
  totalOnHand: number
  totalReserved: number
  totalAvailable: number
  lastMovementAt: string | null
}

export type InventoryMovementResult = {
  movement: StockMovement
  linkedMovement?: StockMovement
  warehouseCode: string
}

export type InventoryBalanceView = {
  stockCardId: string
  materialCode: string
  materialName: string
  warehouseCode: string
  warehouseName: string
  unit: string
  onHand: number
  reserved: number
  available: number
}

export { type StockMovement, type StockMovementType, type StockReferenceType }
