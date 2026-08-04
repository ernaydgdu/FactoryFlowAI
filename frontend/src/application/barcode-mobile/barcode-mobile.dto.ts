import type {
  BundleLabelView,
  OfflineQueueItem,
  PalletLabelView,
  ScanKind,
  ScanResult,
  Symbology,
} from '@/domain/barcode-mobile/barcode.types'

export type ScanResultDto = ScanResult

export type OfflineQueueItemDto = OfflineQueueItem

export type BundleLabelDto = BundleLabelView

export type PalletLabelDto = PalletLabelView

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
  symbology: Symbology
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

export type ScanCommand = {
  raw: string
  actorUserId: string
  offline?: boolean
}
