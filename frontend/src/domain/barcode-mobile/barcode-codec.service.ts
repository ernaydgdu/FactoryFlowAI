/**
 * Barcode codec — encode/decode Kepler wire formats + GS1-128/QR skeletons.
 * Reuses existing encodeBundleBarcode / parseBundleBarcode (no aggregate change).
 */
import { encodeBundleBarcode, parseBundleBarcode } from '@/domain/execution-platform/bundle-model'
import type { BundleBarcodePayload } from '@/domain/execution-platform/execution-types'

import type { DecodedBarcode, Symbology } from './barcode.types'

export function encodeOperationBarcode(productionOrderNo: string, operationCode: string): string {
  return `KPL-OP-V1|${productionOrderNo}|${operationCode}`
}

export function encodeMaterialBarcode(stockCardCode: string): string {
  return `KPL-MAT-V1|${stockCardCode}`
}

export function encodeFinishedGoodsBarcode(productionOrderNo: string): string {
  return `KPL-FG-V1|${productionOrderNo}`
}

export function encodePalletBarcode(warehouseCode: string, palletSeq: string, productionOrderNo?: string): string {
  return `KPL-PAL-V1|${warehouseCode}|${palletSeq}|${productionOrderNo ?? ''}`
}

/** GS1-128 iskeleti — AI string (binary Code128 encoder yok). */
export function encodeGs1128Skeleton(input: {
  gtin?: string
  lot?: string
  qty?: number
  /** AI (00) SSCC-18 */
  sscc?: string
}): string {
  const parts: string[] = []
  if (input.sscc) parts.push(`(00)${input.sscc}`)
  if (input.gtin) parts.push(`(01)${input.gtin}`)
  if (input.lot) parts.push(`(10)${input.lot}`)
  if (input.qty != null) parts.push(`(37)${input.qty}`)
  return parts.join('')
}

export function encodeQrPayload(data: Record<string, string | number>): string {
  return JSON.stringify({ v: 1, ...data })
}

export function encodeExistingBundle(payload: BundleBarcodePayload): string {
  return encodeBundleBarcode(payload)
}

export function decodeBarcode(raw: string): DecodedBarcode {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { raw: trimmed, symbology: 'UNKNOWN', kind: 'UNKNOWN' }
  }

  const bundle = parseBundleBarcode(trimmed)
  if (bundle) {
    return {
      raw: trimmed,
      symbology: 'KPL_BUNDLE',
      kind: 'BUNDLE',
      productionOrderNo: bundle.productionOrderNo,
    }
  }

  if (trimmed.startsWith('KPL-OP-V1|')) {
    const [, po, op] = trimmed.split('|')
    return { raw: trimmed, symbology: 'KPL_OP', kind: 'OPERATION', productionOrderNo: po, operationCode: op }
  }
  if (trimmed.startsWith('KPL-MAT-V1|')) {
    const [, code] = trimmed.split('|')
    return { raw: trimmed, symbology: 'KPL_MAT', kind: 'MATERIAL', stockCardCode: code }
  }
  if (trimmed.startsWith('KPL-FG-V1|')) {
    const [, po] = trimmed.split('|')
    return { raw: trimmed, symbology: 'KPL_FG', kind: 'FINISHED_GOODS', productionOrderNo: po }
  }
  if (trimmed.startsWith('KPL-PAL-V1|')) {
    const [, wh, seq, po] = trimmed.split('|')
    return {
      raw: trimmed,
      symbology: 'KPL_PAL',
      kind: 'PALLET',
      warehouseCode: wh,
      palletSeq: seq,
      productionOrderNo: po || undefined,
    }
  }

  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed) as Record<string, string>
      return {
        raw: trimmed,
        symbology: 'QR',
        kind: (json.kind as DecodedBarcode['kind']) ?? 'UNKNOWN',
        productionOrderNo: json.productionOrderNo,
        operationCode: json.operationCode,
        stockCardCode: json.stockCardCode,
        warehouseCode: json.warehouseCode,
      }
    } catch {
      /* fall through */
    }
  }

  if (trimmed.includes('(01)') || trimmed.includes('(10)') || trimmed.includes('(21)')) {
    const gtin = trimmed.match(/\(01\)(\d+)/)?.[1]
    const lot = trimmed.match(/\(10\)([^\(]+)/)?.[1]
    const qtyRaw = trimmed.match(/\(37\)(\d+)/)?.[1]
    const serial = trimmed.match(/\(21\)([^\(]+)/)?.[1]
    return {
      raw: trimmed,
      symbology: 'GS1_128',
      kind: 'MATERIAL',
      gs1: { gtin, lot, qty: qtyRaw ? Number(qtyRaw) : undefined, serial },
      stockCardCode: lot ?? gtin,
    }
  }

  // Fallback: treat as material stock card code
  return { raw: trimmed, symbology: 'UNKNOWN' as Symbology, kind: 'MATERIAL', stockCardCode: trimmed }
}
