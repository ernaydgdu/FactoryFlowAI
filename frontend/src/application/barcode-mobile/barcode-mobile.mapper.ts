import {
  encodeFinishedGoodsBarcode,
  encodeGs1128Skeleton,
  encodeMaterialBarcode,
  encodeOperationBarcode,
  encodePalletBarcode,
  encodeQrPayload,
} from '@/domain/barcode-mobile/barcode-codec.service'
import { listOfflineQueue } from '@/domain/barcode-mobile/offline-queue.service'
import type { BarcodeDashboardDto, BarcodeFormatSampleDto } from './barcode-mobile.dto'

export function mapBarcodeDashboard(): BarcodeDashboardDto {
  const queue = listOfflineQueue()
  const pending = queue.filter((q) => q.status === 'Pending').length
  const failed = queue.filter((q) => q.status === 'Failed').length

  const formats: BarcodeFormatSampleDto[] = [
    {
      kind: 'BUNDLE',
      symbology: 'KPL_BUNDLE',
      example: 'KPL-BUNDLE-V1|…',
      description: 'Mevcut bundle barcode (parseBundleBarcode)',
    },
    {
      kind: 'OPERATION',
      symbology: 'KPL_OP',
      example: encodeOperationBarcode('UE-DEMO', 'CUT'),
      description: 'Operasyon tarama',
    },
    {
      kind: 'MATERIAL',
      symbology: 'KPL_MAT',
      example: encodeMaterialBarcode('STK-DEMO'),
      description: 'Malzeme / stok kartı',
    },
    {
      kind: 'FINISHED_GOODS',
      symbology: 'KPL_FG',
      example: encodeFinishedGoodsBarcode('UE-DEMO'),
      description: 'Mamül (fg-{UE} uyumlu)',
    },
    {
      kind: 'PALLET',
      symbology: 'KPL_PAL',
      example: encodePalletBarcode('WH-FG', 'P001', 'UE-DEMO'),
      description: 'Palet etiketi',
    },
    {
      kind: 'MATERIAL',
      symbology: 'GS1_128',
      example: encodeGs1128Skeleton({ gtin: '08601234567890', lot: 'LOT1', qty: 10 }),
      description: 'GS1-128 AI iskeleti',
    },
    {
      kind: 'BUNDLE',
      symbology: 'QR',
      example: encodeQrPayload({ kind: 'BUNDLE', productionOrderNo: 'UE-DEMO' }),
      description: 'QR JSON payload',
    },
  ]

  return {
    kpis: [
      { label: 'Format', value: String(formats.length) },
      { label: 'Offline Pending', value: String(pending) },
      { label: 'Offline Failed', value: String(failed) },
      { label: 'Queue Total', value: String(queue.length) },
    ],
    formats,
    offlinePending: pending,
    offlineFailed: failed,
    queuePreview: queue.slice(0, 20),
  }
}
