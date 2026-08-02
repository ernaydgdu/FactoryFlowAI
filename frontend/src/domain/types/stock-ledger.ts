/** Stock Ledger — ERP'nin tek stok gerçeği. Stok doğrudan değişmez; her değişiklik hareket üretir. */

export type StockMovementType =
  | 'RECEIPT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'CONSUMPTION'
  | 'WASTE'
  | 'PRODUCTION_OUTPUT'
  | 'SHIPMENT'
  | 'ADJUSTMENT'

export type StockReferenceType =
  | 'ORDER'
  | 'MRP'
  | 'PR'
  | 'PO'
  | 'PRODUCTION'
  | 'TRANSFER'
  | 'SHIPMENT'

export type StockMovement = {
  id: string
  movementNo: string
  type: StockMovementType
  stockCardId: string
  materialCode: string
  materialName: string
  warehouseCode: string
  warehouseName: string
  quantity: number
  unit: string
  referenceType: StockReferenceType
  referenceId: string
  referenceNo: string
  reason: string
  createdAt: string
  createdBy: string
  linkedMovementId?: string
  /** Hareket sonrası depo bazlı fiziksel stok */
  onHandAfter?: number
  /** Hareket sonrası rezerve miktar */
  reservedAfter?: number
}

export type StockBalance = {
  stockCardId: string
  materialCode: string
  warehouseCode: string
  warehouseName: string
  unit: string
  onHand: number
  reserved: number
  available: number
}

export type StockLedger = {
  movements: StockMovement[]
  balances: StockBalance[]
  lastMovementNo: number
}

export type ProductionEntryInput = {
  productionOrderId: string
  productionOrderNo: string
  orderId: string
  orderNo: string
  stockCardId: string
  plannedQty: number
  producedQty: number
  wasteQty: number
  /** Fire için ek kumaş düşümü (metre/kg). Adet fire otomatik düşülmez. */
  wasteMaterialQty?: number
  consumptionPerUnit: number
  workshopWarehouseCode: string
  unit: string
}

export type ProductionEntryResult = {
  producedQty: number
  wasteQty: number
  missingQty: number
  consumedQty: number
  remainingInWorkshop: number
  movements: StockMovement[]
}

export type TransferInput = {
  transferId: string
  transferNo: string
  stockCardId: string
  quantity: number
  fromWarehouseCode: string
  toWarehouseCode: string
  referenceType: StockReferenceType
  referenceId: string
  referenceNo: string
  createdBy: string
}

export type PurchaseReceiptInput = {
  poId: string
  poNo: string
  stockCardId: string
  quantity: number
  warehouseCode: string
  createdBy: string
}

export type ProductionReservationInput = {
  productionOrderId: string
  productionOrderNo: string
  orderId: string
  orderNo: string
  lines: {
    stockCardId: string
    quantity: number
    warehouseCode: string
  }[]
  createdBy: string
}

export type ShipmentInput = {
  shipmentId: string
  shipmentNo: string
  orderId: string
  orderNo: string
  quantity: number
  warehouseCode: string
  createdBy: string
}

export type BusinessRuleId =
  | 'BR-01-ORDER-MRP-PR'
  | 'BR-02-PO-RECEIPT'
  | 'BR-03-PRODUCTION-RESERVE'
  | 'BR-04-WORKSHOP-TRANSFER'
  | 'BR-05-PRODUCTION-ENTRY'
  | 'BR-06-MATERIAL-CONSUMPTION'
  | 'BR-07-WORKSHOP-REMAINING'
  | 'BR-08-PRODUCTION-COMPLETE'
  | 'BR-09-SHIPMENT'
  | 'BR-10-STOCK-LEDGER'
  | 'BR-11-PRODUCTION-SPLIT'
  | 'BR-12-LEFTOVER-REUSE'
  | 'BR-13-QUALITY-REWORK'
  | 'BR-14-ACCESSORY-DELAY'

export type AccessoryDelayInput = {
  stockCardId: string
  stockCardName: string
  supplierName: string
  delayDays: number
  reportedBy: string
}

export type QualityReworkInput = {
  inspectionId: string
  inspectionNo: string
  orderId: string
  orderNo: string
  repairQty: number
  reworkWorkOrderNo: string
  workshopWarehouseCode: string
  fabricStockCardId: string
  consumptionPerUnit: number
  createdBy: string
}

export type LeftoverReuseInput = {
  stockCardId: string
  fromWarehouseCode: string
  toWarehouseCode: string
  quantity: number
  sourceOrderId: string
  sourceOrderNo: string
  targetOrderId: string
  targetOrderNo: string
  createdBy: string
}

export type SplitProductionLine = {
  splitIndex: number
  splitId: string
  workOrderNo: string
  workshopCode: string
  plannedQty: number
  fabricMeters: number
}

export type SplitProductionInput = {
  parentOrderId: string
  parentOrderNo: string
  parentWorkOrderNo: string
  stockCardId: string
  fabricWarehouseCode: string
  splits: SplitProductionLine[]
  createdBy: string
}

export type BusinessRuleDefinition = {
  id: BusinessRuleId
  name: string
  trigger: string
  actions: string[]
  invariant: string
}

export type RuleExecutionResult<T = unknown> = {
  success: boolean
  ruleId: BusinessRuleId
  ruleName: string
  movements: StockMovement[]
  ledger: StockLedger
  payload?: T
  errors?: string[]
}
