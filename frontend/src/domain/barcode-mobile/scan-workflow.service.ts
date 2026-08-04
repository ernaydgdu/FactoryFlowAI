/**
 * Scan workflow — barcode resolve + durable mutations via existing inventory /
 * purchasing / shop-floor write paths (audit + timeline + outbox inherited).
 * Idempotency: client idempotencyKey → GR id / movement referenceNo / daily reasonCode.
 *
 * Callers must wrap mutations in runCommandInTransaction (application layer).
 */
import { getOperationDailyEntries } from '@/domain/execution-platform/execution-platform-service'
import {
  persistFinishedGoodsReceipt,
  persistGoodsIssue,
  persistShipment,
} from '@/domain/inventory/stock-ledger-crud.service'
import { warehouseRepository } from '@/domain/master-data'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'
import { persistPostGoodsReceipt } from '@/domain/purchasing/goods-receipt-crud.service'
import { persistProductionDeclaration } from '@/domain/shop-floor/production-declaration.service'
import { queryStockCardByCode } from '@/domain/stock-card/stock-card-query.service'

import { decodeBarcode } from './barcode-codec.service'
import type { ScanResult, WorkflowKind } from './barcode.types'

export class BarcodeMobileDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BarcodeMobileDomainError'
  }
}

function requireKey(key: string | undefined): string {
  if (!key?.trim()) throw new BarcodeMobileDomainError('idempotencyKey zorunlu.')
  return key.trim()
}

function requireQty(qty: number | undefined): number {
  if (qty == null || !Number.isFinite(qty) || qty <= 0) {
    throw new BarcodeMobileDomainError('Miktar sıfırdan büyük olmalı.')
  }
  return qty
}

export type ReceivingScanInput = {
  raw: string
  purchaseOrderId: string
  warehouseCode: string
  quantity: number
  actorUserId: string
  idempotencyKey: string
  lot?: string
}

export function executeReceivingScan(input: ReceivingScanInput): ScanResult {
  const key = requireKey(input.idempotencyKey)
  const qty = requireQty(input.quantity)
  const decoded = decodeBarcode(input.raw)
  const code = decoded.stockCardCode ?? decoded.gs1?.lot
  if (!code) {
    return {
      kind: 'RECEIVING',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Mal kabul için malzeme barkodu / stok kodu gerekli.',
    }
  }
  const card = queryStockCardByCode(code)
  if (!card) {
    return {
      kind: 'RECEIVING',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Stok kartı bulunamadı: ${code}`,
      stockCardCode: code,
    }
  }
  if (!input.purchaseOrderId || !input.warehouseCode) {
    throw new BarcodeMobileDomainError('Mal kabul için purchaseOrderId ve warehouseCode zorunlu.')
  }
  const gr = persistPostGoodsReceipt(
    {
      purchaseOrderId: input.purchaseOrderId,
      warehouseCode: input.warehouseCode,
      lines: [{ materialCode: card.code, quantity: qty, lot: input.lot ?? decoded.gs1?.lot }],
      idempotencyKey: key,
    },
    input.actorUserId,
  )
  return {
    kind: 'RECEIVING',
    raw: input.raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Mal kabul ${gr.grNo} · ${card.code} × ${qty}`,
    stockCardId: card.id,
    stockCardCode: card.code,
    warehouseCode: input.warehouseCode,
    entityId: gr.id,
    entityNo: gr.grNo,
    idempotentReplay: gr.id === `gr-idem-${key}`,
  }
}

export type MaterialIssueScanInput = {
  raw: string
  quantity: number
  warehouseCode?: string
  productionOrderNo?: string
  actorUserId: string
  idempotencyKey: string
}

export function executeMaterialIssueScan(input: MaterialIssueScanInput): ScanResult {
  const key = requireKey(input.idempotencyKey)
  const qty = requireQty(input.quantity)
  const decoded = decodeBarcode(input.raw)
  const code = decoded.stockCardCode
  if (!code) {
    return {
      kind: 'MATERIAL_ISSUE',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Malzeme çıkış için stok barkodu gerekli.',
    }
  }
  const card = queryStockCardByCode(code)
  if (!card) {
    return {
      kind: 'MATERIAL_ISSUE',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Stok kartı bulunamadı: ${code}`,
      stockCardCode: code,
    }
  }
  const warehouseCode = input.warehouseCode ?? card.warehouseCode
  const result = persistGoodsIssue(
    {
      stockCardId: card.id,
      warehouseCode,
      quantity: qty,
      referenceType: input.productionOrderNo ? 'PRODUCTION' : 'TRANSFER',
      referenceId: input.productionOrderNo ?? key,
      referenceNo: key,
      reason: `Scan material issue — ${card.code}`,
    },
    input.actorUserId,
  )
  return {
    kind: 'MATERIAL_ISSUE',
    raw: input.raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Malzeme çıkış ${result.movement.movementNo} · ${card.code} × ${qty}`,
    stockCardId: card.id,
    stockCardCode: card.code,
    warehouseCode,
    productionOrderNo: input.productionOrderNo,
    entityId: result.movement.id,
    entityNo: result.movement.movementNo,
  }
}

export type ProductionScanInput = {
  raw: string
  produced: number
  actorUserId: string
  idempotencyKey: string
  lineId?: string
  machineId?: string
  shiftCode?: string
  planned?: number
}

export function executeProductionScanWorkflow(input: ProductionScanInput): ScanResult {
  const key = requireKey(input.idempotencyKey)
  const produced = requireQty(input.produced)
  const decoded = decodeBarcode(input.raw)
  const productionOrderNo = decoded.productionOrderNo
  const operationCode = decoded.operationCode
  if (!productionOrderNo || !operationCode) {
    return {
      kind: 'PRODUCTION',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Üretim taraması için KPL-OP-V1|UE|OP barkodu gerekli.',
    }
  }
  const reasonCode = `IDEM:${key}`
  const prior = getOperationDailyEntries(productionOrderNo).find((e) => e.reasonCode === reasonCode)
  if (prior) {
    return {
      kind: 'PRODUCTION',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: true,
      message: `Üretim deklarasyonu zaten işlendi (${prior.id})`,
      productionOrderNo,
      operationCode,
      entityId: prior.id,
      entityNo: prior.id,
      idempotentReplay: true,
    }
  }
  const result = persistProductionDeclaration(
    {
      productionOrderNo,
      operationCode,
      lineId: input.lineId ?? 'LINE-1',
      operatorId: input.actorUserId,
      machineId: input.machineId ?? 'MACHINE-1',
      shiftCode: input.shiftCode ?? 'A',
      entryDate: new Date().toISOString().slice(0, 10),
      planned: input.planned ?? produced,
      produced,
      reject: 0,
      rework: 0,
      secondQuality: 0,
      fire: 0,
      downtimeMinutes: 0,
      reasonCode,
    },
    input.actorUserId,
  )
  return {
    kind: 'PRODUCTION',
    raw: input.raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Deklarasyon ${result.operationEntryId} · üretilen ${produced} · UE toplam ${result.producedQtyTotal}`,
    productionOrderNo,
    operationCode,
    entityId: result.operationEntryId,
    entityNo: result.operationEntryId,
  }
}

export type FgReceiptScanInput = {
  raw: string
  quantity: number
  warehouseCode: string
  actorUserId: string
  idempotencyKey: string
}

export function executeFgReceiptScan(input: FgReceiptScanInput): ScanResult {
  const key = requireKey(input.idempotencyKey)
  const qty = requireQty(input.quantity)
  const decoded = decodeBarcode(input.raw)
  let productionOrderNo = decoded.productionOrderNo
  if (!productionOrderNo && input.raw.startsWith('fg-')) productionOrderNo = input.raw.slice(3)
  if (!productionOrderNo) {
    return {
      kind: 'FG_RECEIPT',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Mamül kabul için KPL-FG-V1|UE veya fg-UE gerekli.',
    }
  }
  const po = queryProductionOrderByNo(productionOrderNo)
  if (!po) {
    return {
      kind: 'FG_RECEIPT',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: `Üretim emri bulunamadı: ${productionOrderNo}`,
      productionOrderNo,
    }
  }
  if (!input.warehouseCode) throw new BarcodeMobileDomainError('Mamül depo kodu zorunlu.')
  const result = persistFinishedGoodsReceipt(
    {
      productionOrderId: po.id,
      productionOrderNo: po.productionOrderNo,
      warehouseCode: input.warehouseCode,
      quantity: qty,
      idempotencyKey: key,
      reason: `Scan FG receipt — ${po.productionOrderNo}`,
    },
    input.actorUserId,
  )
  return {
    kind: 'FG_RECEIPT',
    raw: input.raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Mamül kabul ${result.movement.movementNo} · ${po.productionOrderNo} × ${qty}`,
    productionOrderNo: po.productionOrderNo,
    finishedGoodsCardId: `fg-${po.productionOrderNo}`,
    warehouseCode: input.warehouseCode,
    entityId: result.movement.id,
    entityNo: result.movement.movementNo,
  }
}

export type ShipmentScanInput = {
  raw: string
  quantity: number
  warehouseCode?: string
  actorUserId: string
  idempotencyKey: string
  shipmentRef?: string
}

export function executeShipmentScan(input: ShipmentScanInput): ScanResult {
  const key = requireKey(input.idempotencyKey)
  const qty = requireQty(input.quantity)
  const decoded = decodeBarcode(input.raw)
  let stockCardId: string | null = null
  let stockCardCode: string | undefined
  if (decoded.kind === 'FINISHED_GOODS' && decoded.productionOrderNo) {
    stockCardId = `fg-${decoded.productionOrderNo}`
    stockCardCode = stockCardId
  } else if (decoded.stockCardCode) {
    const card = queryStockCardByCode(decoded.stockCardCode)
    if (card) {
      stockCardId = card.id
      stockCardCode = card.code
    }
  }
  if (!stockCardId) {
    return {
      kind: 'SHIPMENT',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Sevkiyat için malzeme veya mamül barkodu gerekli.',
    }
  }
  const card = stockCardCode && !stockCardCode.startsWith('fg-') ? queryStockCardByCode(stockCardCode) : null
  const warehouseCode =
    input.warehouseCode ??
    decoded.warehouseCode ??
    card?.warehouseCode ??
    warehouseRepository.find((w) => w.type === 'Mamül')[0]?.code
  if (!warehouseCode) {
    return {
      kind: 'SHIPMENT',
      raw: input.raw,
      symbology: decoded.symbology,
      ok: false,
      message: 'Sevkiyat deposu belirlenemedi.',
    }
  }
  const result = persistShipment(
    {
      stockCardId,
      warehouseCode,
      quantity: qty,
      referenceId: input.shipmentRef ?? key,
      referenceNo: key,
      reason: `Scan shipment — ${stockCardId}`,
    },
    input.actorUserId,
  )
  return {
    kind: 'SHIPMENT',
    raw: input.raw,
    symbology: decoded.symbology,
    ok: true,
    message: `Sevkiyat ${result.movement.movementNo} · ${stockCardId} × ${qty}`,
    stockCardId,
    stockCardCode: stockCardCode ?? stockCardId,
    warehouseCode,
    productionOrderNo: decoded.productionOrderNo,
    entityId: result.movement.id,
    entityNo: result.movement.movementNo,
  }
}

export function runWorkflow(
  workflow: WorkflowKind,
  payload: Record<string, unknown>,
  actorUserId: string,
  idempotencyKey: string,
): ScanResult {
  const raw = String(payload.raw ?? '')
  switch (workflow) {
    case 'RECEIVING':
      return executeReceivingScan({
        raw,
        purchaseOrderId: String(payload.purchaseOrderId ?? ''),
        warehouseCode: String(payload.warehouseCode ?? ''),
        quantity: Number(payload.quantity),
        lot: payload.lot ? String(payload.lot) : undefined,
        actorUserId,
        idempotencyKey,
      })
    case 'MATERIAL_ISSUE':
      return executeMaterialIssueScan({
        raw,
        quantity: Number(payload.quantity),
        warehouseCode: payload.warehouseCode ? String(payload.warehouseCode) : undefined,
        productionOrderNo: payload.productionOrderNo ? String(payload.productionOrderNo) : undefined,
        actorUserId,
        idempotencyKey,
      })
    case 'PRODUCTION':
      return executeProductionScanWorkflow({
        raw,
        produced: Number(payload.produced ?? payload.quantity),
        lineId: payload.lineId ? String(payload.lineId) : undefined,
        machineId: payload.machineId ? String(payload.machineId) : undefined,
        shiftCode: payload.shiftCode ? String(payload.shiftCode) : undefined,
        planned: payload.planned != null ? Number(payload.planned) : undefined,
        actorUserId,
        idempotencyKey,
      })
    case 'FG_RECEIPT':
      return executeFgReceiptScan({
        raw,
        quantity: Number(payload.quantity),
        warehouseCode: String(payload.warehouseCode ?? ''),
        actorUserId,
        idempotencyKey,
      })
    case 'SHIPMENT':
      return executeShipmentScan({
        raw,
        quantity: Number(payload.quantity),
        warehouseCode: payload.warehouseCode ? String(payload.warehouseCode) : undefined,
        shipmentRef: payload.shipmentRef ? String(payload.shipmentRef) : undefined,
        actorUserId,
        idempotencyKey,
      })
    default:
      throw new BarcodeMobileDomainError(`Bilinmeyen workflow: ${workflow}`)
  }
}
