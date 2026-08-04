/**
 * Scan execution — resolves barcodes against existing repositories.
 * Does not mutate Shop Floor / Quality aggregates.
 */
import { lookupBundleByScan } from '@/domain/execution-platform/bundle-tracking-service'
import { getExecutionContext } from '@/domain/execution-platform/execution-platform-service'
import { getOperationExecutions } from '@/domain/execution-platform/operation-execution-service'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'
import { queryStockCardByCode } from '@/domain/stock-card/stock-card-query.service'

import { decodeBarcode } from './barcode-codec.service'
import type { ScanResult } from './barcode.types'

export class BarcodeMobileDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BarcodeMobileDomainError'
  }
}

export function executeScanBundle(raw: string): ScanResult {
  const decoded = decodeBarcode(raw)
  const bundle = lookupBundleByScan(raw) ?? (decoded.kind === 'BUNDLE' ? lookupBundleByScan(decoded.raw) : null)
  if (!bundle) {
    return {
      kind: 'BUNDLE',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Bundle bulunamadı — barcode eşleşmedi.',
    }
  }
  return {
    kind: 'BUNDLE',
    raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Bundle ${bundle.bundleNo} · ${bundle.status} @ ${bundle.currentOperationCode ?? '—'}`,
    productionOrderNo: bundle.productionOrderNo,
    bundleId: bundle.id,
    bundleNo: bundle.bundleNo,
    operationCode: bundle.currentOperationCode ?? undefined,
  }
}

export function executeScanOperation(raw: string): ScanResult {
  const decoded = decodeBarcode(raw)
  if (decoded.kind !== 'OPERATION' || !decoded.productionOrderNo || !decoded.operationCode) {
    return {
      kind: 'OPERATION',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Operasyon barkodu bekleniyor (KPL-OP-V1|UE|OP).',
    }
  }
  const ctx = getExecutionContext(decoded.productionOrderNo)
  if (!ctx) {
    return {
      kind: 'OPERATION',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Execution context yok: ${decoded.productionOrderNo}`,
      productionOrderNo: decoded.productionOrderNo,
      operationCode: decoded.operationCode,
    }
  }
  const op = getOperationExecutions(decoded.productionOrderNo).find(
    (o) => o.operationCode === decoded.operationCode,
  )
  if (!op) {
    return {
      kind: 'OPERATION',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Operasyon bulunamadı: ${decoded.operationCode}`,
      productionOrderNo: decoded.productionOrderNo,
      operationCode: decoded.operationCode,
    }
  }
  return {
    kind: 'OPERATION',
    raw,
    symbology: decoded.symbology,
    ok: true,
    message: `${op.operationName} · ${op.status} · ${op.completedQty}/${op.plannedQty}`,
    productionOrderNo: decoded.productionOrderNo,
    operationCode: decoded.operationCode,
  }
}

export function executeScanMaterial(raw: string): ScanResult {
  const decoded = decodeBarcode(raw)
  const code = decoded.stockCardCode ?? (decoded.kind === 'MATERIAL' ? decoded.raw : null)
  if (!code) {
    return {
      kind: 'MATERIAL',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Malzeme barkodu / stok kartı kodu bekleniyor.',
    }
  }
  const card = queryStockCardByCode(code)
  if (!card) {
    return {
      kind: 'MATERIAL',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Stok kartı bulunamadı: ${code}`,
      stockCardCode: code,
    }
  }
  return {
    kind: 'MATERIAL',
    raw,
    symbology: decoded.symbology,
    ok: true,
    message: `${card.code} — ${card.name} @ ${card.warehouseCode}`,
    stockCardId: card.id,
    stockCardCode: card.code,
    warehouseCode: card.warehouseCode,
  }
}

export function executeScanFinishedGoods(raw: string): ScanResult {
  const decoded = decodeBarcode(raw)
  let productionOrderNo = decoded.productionOrderNo
  if (decoded.kind === 'FINISHED_GOODS') {
    productionOrderNo = decoded.productionOrderNo
  } else if (decoded.kind === 'PALLET' && decoded.productionOrderNo) {
    productionOrderNo = decoded.productionOrderNo
  } else if (raw.startsWith('fg-')) {
    productionOrderNo = raw.slice(3)
  }
  if (!productionOrderNo) {
    if (decoded.kind === 'PALLET') {
      return {
        kind: 'PALLET',
        raw,
        symbology: decoded.symbology,
        ok: true,
        message: `Palet ${decoded.palletSeq} @ ${decoded.warehouseCode} (UE bağlı değil)`,
        warehouseCode: decoded.warehouseCode,
      }
    }
    return {
      kind: 'FINISHED_GOODS',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Mamül barkodu bekleniyor (KPL-FG-V1|UE veya fg-UE).',
    }
  }
  const po = queryProductionOrderByNo(productionOrderNo)
  if (!po) {
    return {
      kind: decoded.kind === 'PALLET' ? 'PALLET' : 'FINISHED_GOODS',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Üretim emri bulunamadı: ${productionOrderNo}`,
      productionOrderNo,
      warehouseCode: decoded.warehouseCode,
    }
  }
  return {
    kind: decoded.kind === 'PALLET' ? 'PALLET' : 'FINISHED_GOODS',
    raw,
    symbology: decoded.symbology,
    ok: true,
    message: `${po.productionOrderNo} · ${po.productName} · üretilen ${po.producedQty}`,
    productionOrderNo: po.productionOrderNo,
    finishedGoodsCardId: `fg-${po.productionOrderNo}`,
    warehouseCode: decoded.warehouseCode,
  }
}

export function executeScanProduction(raw: string): ScanResult {
  // Production scan = UE no or OP barcode → context
  const decoded = decodeBarcode(raw)
  const poNo =
    decoded.productionOrderNo ??
    (raw.startsWith('UE-') ? raw : null) ??
    (decoded.kind === 'OPERATION' ? decoded.productionOrderNo : null)
  if (!poNo) {
    return {
      kind: 'OPERATION',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Üretim emri / operasyon barkodu bekleniyor.',
    }
  }
  if (decoded.kind === 'OPERATION') return executeScanOperation(raw)
  const po = queryProductionOrderByNo(poNo)
  if (!po) {
    return {
      kind: 'OPERATION',
      raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Üretim emri bulunamadı: ${poNo}`,
      productionOrderNo: poNo,
    }
  }
  return {
    kind: 'OPERATION',
    raw,
    symbology: decoded.symbology,
    ok: true,
    message: `${po.productionOrderNo} · ${po.status} · ${po.producedQty}/${po.plannedQty}`,
    productionOrderNo: po.productionOrderNo,
  }
}
