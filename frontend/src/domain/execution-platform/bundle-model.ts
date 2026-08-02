/**
 * Bundle Model — endüstri sentezi (PBS / CMT / Infor / SAP prensipleri)
 * Format: KPL-BUNDLE-V1 — STYLE|LOT|COLOR|SIZE|SEQ|COMPONENT|QTY
 */
import {
  BUNDLE_BARCODE_FORMAT_VERSION,
  type BundleBarcodePayload,
  type BundleComponentCode,
} from './execution-types'

const COMPONENT_ALIASES: Record<string, BundleComponentCode> = {
  GARMENT: 'GARMENT',
  FRT: 'FRT',
  FRONT: 'FRT',
  BK: 'BK',
  BACK: 'BK',
  SLV: 'SLV',
  SLEEVE: 'SLV',
  'SLV-L': 'SLV-L',
  'SLV-R': 'SLV-R',
  CLR: 'CLR',
  COLLAR: 'CLR',
  PKT: 'PKT',
  POCKET: 'PKT',
  CUFF: 'CUFF',
  YKE: 'YKE',
  YOKE: 'YKE',
}

export function normalizeComponentCode(raw: string): BundleComponentCode {
  const key = raw.trim().toUpperCase()
  return COMPONENT_ALIASES[key] ?? 'GARMENT'
}

export function sanitizeBarcodeSegment(value: string, maxLen: number): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, maxLen)
}

export function buildAssemblyGroupId(
  productionOrderNo: string,
  colorCode: string,
  sizeCode: string,
  groupIndex: number,
): string {
  return `AG-${productionOrderNo}-${sanitizeBarcodeSegment(colorCode, 8)}-${sanitizeBarcodeSegment(sizeCode, 6)}-${String(groupIndex).padStart(4, '0')}`
}

export function buildBundleBarcodePayload(input: {
  style: string
  lot: string
  color: string
  size: string
  bundleSequence: number
  component: BundleComponentCode
  pieceCount: number
  productionOrderNo: string
  assemblyGroupId: string
}): BundleBarcodePayload {
  return {
    formatVersion: BUNDLE_BARCODE_FORMAT_VERSION,
    style: sanitizeBarcodeSegment(input.style, 12),
    lot: sanitizeBarcodeSegment(input.lot, 12),
    color: sanitizeBarcodeSegment(input.color, 8),
    size: sanitizeBarcodeSegment(input.size, 6),
    bundleSequence: input.bundleSequence,
    component: input.component,
    pieceCount: input.pieceCount,
    productionOrderNo: input.productionOrderNo,
    assemblyGroupId: input.assemblyGroupId,
  }
}

/** Compact barcode — scan-friendly, lookup-free routing */
export function encodeBundleBarcode(payload: BundleBarcodePayload): string {
  const seq = String(payload.bundleSequence).padStart(3, '0')
  return [
    payload.formatVersion,
    payload.style,
    payload.lot,
    payload.color,
    payload.size,
    seq,
    payload.component,
    String(payload.pieceCount),
    payload.productionOrderNo,
  ].join('|')
}

export function parseBundleBarcode(barcode: string): BundleBarcodePayload | null {
  const parts = barcode.split('|')
  if (parts.length < 9) return null
  const [formatVersion, style, lot, color, size, seqStr, component, qtyStr, productionOrderNo] = parts
  if (formatVersion !== BUNDLE_BARCODE_FORMAT_VERSION) return null
  const bundleSequence = parseInt(seqStr, 10)
  const pieceCount = parseInt(qtyStr, 10)
  if (Number.isNaN(bundleSequence) || Number.isNaN(pieceCount)) return null

  const assemblyGroupId = buildAssemblyGroupId(productionOrderNo, color, size, bundleSequence)

  return {
    formatVersion: BUNDLE_BARCODE_FORMAT_VERSION,
    style,
    lot,
    color,
    size,
    bundleSequence,
    component: normalizeComponentCode(component),
    pieceCount,
    productionOrderNo,
    assemblyGroupId,
  }
}

/** Human-readable bundle no — floor reference when scanner unavailable */
export function formatHumanBundleNo(payload: BundleBarcodePayload): string {
  const seq = String(payload.bundleSequence).padStart(3, '0')
  return `${payload.style}-${payload.lot}-${payload.color}-${payload.size}-${seq}-${payload.component}`
}

export function distributePiecesIntoBundles(totalPieces: number, bundleSize: number): number[] {
  if (totalPieces <= 0 || bundleSize <= 0) return []
  const fullBundles = Math.floor(totalPieces / bundleSize)
  const remainder = totalPieces % bundleSize
  const sizes = Array.from({ length: fullBundles }, () => bundleSize)
  if (remainder > 0) sizes.push(remainder)
  return sizes
}
