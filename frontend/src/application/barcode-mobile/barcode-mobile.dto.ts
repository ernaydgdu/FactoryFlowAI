import type {
  BundleLabelView,
  OfflineQueueItem,
  PalletLabelView,
  ScanKind,
  ScanResult,
  SyncResult,
  WorkflowKind,
} from '@/domain/barcode-mobile/barcode.types'

export type ScanResultDto = ScanResult
export type OfflineQueueItemDto = OfflineQueueItem
export type BundleLabelDto = BundleLabelView
export type PalletLabelDto = PalletLabelView
export type SyncResultDto = SyncResult

export type FinishedGoodsLabelDto = {
  labelType: 'FINISHED_GOODS'
  barcode: string
  productionOrderNo: string
  stockCardId: string
  qrPayload: string
  gs1Skeleton: string
}

export type BarcodeFormatSampleDto = {
  kind: ScanKind
  symbology: string
  example: string
  description: string
}

export type BarcodeDashboardDto = {
  kpis: Array<{ label: string; value: string }>
  formats: BarcodeFormatSampleDto[]
  offlinePending: number
  offlineFailed: number
  queuePreview: OfflineQueueItemDto[]
}

/** Resolve-only scan (no mutation). */
export type ScanCommand = {
  raw: string
  actorUserId: string
  offline?: boolean
}

export type WorkflowScanCommand = {
  workflow: WorkflowKind
  raw: string
  actorUserId: string
  idempotencyKey: string
  quantity?: number
  produced?: number
  purchaseOrderId?: string
  warehouseCode?: string
  productionOrderNo?: string
  lot?: string
  lineId?: string
  machineId?: string
  shiftCode?: string
  shipmentRef?: string
  offline?: boolean
}
