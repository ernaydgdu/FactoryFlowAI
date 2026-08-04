/**
 * Barcode & Mobile — symbology + scan types.
 * Bundle barcodes reuse KPL-BUNDLE-V1; other codes are Kepler wire formats.
 * GS1-128 is a string skeleton (no binary Code128 encoder).
 */

export type Symbology = 'KPL_BUNDLE' | 'KPL_OP' | 'KPL_MAT' | 'KPL_FG' | 'KPL_PAL' | 'GS1_128' | 'QR' | 'UNKNOWN'

export type ScanKind = 'BUNDLE' | 'OPERATION' | 'MATERIAL' | 'FINISHED_GOODS' | 'PALLET' | 'UNKNOWN'

export type DecodedBarcode = {
  raw: string
  symbology: Symbology
  kind: ScanKind
  productionOrderNo?: string
  operationCode?: string
  stockCardCode?: string
  warehouseCode?: string
  palletSeq?: string
  gs1?: { gtin?: string; lot?: string; qty?: number }
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
}

export type OfflineQueueItem = {
  id: string
  kind: ScanKind
  raw: string
  actorUserId: string
  enqueuedAt: string
  status: 'Pending' | 'Flushed' | 'Failed'
  lastError?: string
}
