/**
 * Barcode & Mobile — symbology + scan / workflow types.
 * Bundle barcodes reuse KPL-BUNDLE-V1; GS1 AI decode + QR JSON are first-class.
 */

export type Symbology = 'KPL_BUNDLE' | 'KPL_OP' | 'KPL_MAT' | 'KPL_FG' | 'KPL_PAL' | 'GS1_128' | 'QR' | 'UNKNOWN'

export type ScanKind =
  | 'BUNDLE'
  | 'OPERATION'
  | 'MATERIAL'
  | 'FINISHED_GOODS'
  | 'PALLET'
  | 'RECEIVING'
  | 'MATERIAL_ISSUE'
  | 'PRODUCTION'
  | 'FG_RECEIPT'
  | 'SHIPMENT'
  | 'UNKNOWN'

export type WorkflowKind = 'RECEIVING' | 'MATERIAL_ISSUE' | 'PRODUCTION' | 'FG_RECEIPT' | 'SHIPMENT'

export type DecodedBarcode = {
  raw: string
  symbology: Symbology
  kind: ScanKind
  productionOrderNo?: string
  operationCode?: string
  stockCardCode?: string
  warehouseCode?: string
  palletSeq?: string
  gs1?: { gtin?: string; lot?: string; qty?: number; serial?: string }
}

export type BundleLabelView = {
  labelType: 'BUNDLE'
  barcode: string
  humanNo: string
  productionOrderNo: string
  style: string
  color: string
  size: string
  qty: number
  qrPayload: string
  gs1Skeleton: string
}

export type PalletLabelView = {
  labelType: 'PALLET'
  barcode: string
  warehouseCode: string
  palletSeq: string
  productionOrderNo: string | null
  qrPayload: string
  gs1Skeleton: string
}

export type ScanResult = {
  kind: ScanKind
  raw: string
  symbology: Symbology
  ok: boolean
  message: string
  productionOrderNo?: string
  operationCode?: string
  bundleId?: string
  bundleNo?: string
  stockCardId?: string
  stockCardCode?: string
  warehouseCode?: string
  finishedGoodsCardId?: string
  entityId?: string
  entityNo?: string
  idempotentReplay?: boolean
}

export type OfflineQueueItem = {
  id: string
  workflow: WorkflowKind
  payload: Record<string, unknown>
  actorUserId: string
  idempotencyKey: string
  enqueuedAt: string
  status: 'Pending' | 'Flushed' | 'Failed'
  lastError?: string
  attempts: number
}

export type SyncResult = {
  flushed: number
  failed: number
  remaining: number
}
