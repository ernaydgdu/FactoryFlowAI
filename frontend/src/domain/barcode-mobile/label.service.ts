/**
 * Label builders — Bundle / Pallet label payloads for print UI (no PDF/ZPL lib).
 */
import { formatHumanBundleNo, parseBundleBarcode } from '@/domain/execution-platform/bundle-model'
import { getBundle } from '@/domain/execution-platform/bundle-tracking-service'

import {
  encodeFinishedGoodsBarcode,
  encodeGs1128Skeleton,
  encodePalletBarcode,
  encodeQrPayload,
} from './barcode-codec.service'
import type { BundleLabelView, PalletLabelView } from './barcode.types'

export function buildBundleLabel(bundleId: string): BundleLabelView | null {
  const bundle = getBundle(bundleId)
  if (!bundle) return null
  const parsed = parseBundleBarcode(bundle.barcode)
  const style = parsed?.style ?? '—'
  const color = parsed?.color ?? '—'
  const size = parsed?.size ?? '—'
  const qty = parsed?.pieceCount ?? bundle.pieceCount
  return {
    labelType: 'BUNDLE',
    barcode: bundle.barcode,
    humanNo: parsed ? formatHumanBundleNo(parsed) : bundle.bundleNo,
    productionOrderNo: bundle.productionOrderNo,
    style,
    color,
    size,
    qty,
    qrPayload: encodeQrPayload({
      kind: 'BUNDLE',
      barcode: bundle.barcode,
      productionOrderNo: bundle.productionOrderNo,
    }),
    gs1Skeleton: encodeGs1128Skeleton({
      gtin: '00000000000000',
      lot: bundle.productionOrderNo,
      qty,
    }),
  }
}

export function buildPalletLabel(input: {
  warehouseCode: string
  palletSeq: string
  productionOrderNo?: string
}): PalletLabelView {
  const barcode = encodePalletBarcode(input.warehouseCode, input.palletSeq, input.productionOrderNo)
  return {
    labelType: 'PALLET',
    barcode,
    warehouseCode: input.warehouseCode,
    palletSeq: input.palletSeq,
    productionOrderNo: input.productionOrderNo ?? null,
    qrPayload: encodeQrPayload({
      kind: 'PALLET',
      warehouseCode: input.warehouseCode,
      palletSeq: input.palletSeq,
      productionOrderNo: input.productionOrderNo ?? '',
    }),
    gs1Skeleton: encodeGs1128Skeleton({
      gtin: '00000000000000',
      lot: input.palletSeq,
      qty: 1,
    }),
  }
}

export function buildFinishedGoodsLabel(productionOrderNo: string) {
  const barcode = encodeFinishedGoodsBarcode(productionOrderNo)
  return {
    labelType: 'FINISHED_GOODS' as const,
    barcode,
    productionOrderNo,
    stockCardId: `fg-${productionOrderNo}`,
    qrPayload: encodeQrPayload({ kind: 'FINISHED_GOODS', productionOrderNo }),
    gs1Skeleton: encodeGs1128Skeleton({ gtin: '00000000000000', lot: productionOrderNo, qty: 1 }),
  }
}
