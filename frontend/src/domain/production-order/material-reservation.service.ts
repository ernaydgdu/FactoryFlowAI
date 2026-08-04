/**
 * Material Reservation — Production Order ↔ kalıcı Stock Ledger bağlantısı.
 *
 * Bugüne kadar Released geçişindeki BR-03 rezervasyonu yalnızca geçici bir
 * in-memory ledger üzerinde doğrulanıyordu (createEmptyLedger) ve kalıcı
 * stok defterine yazılmıyordu. Bu servis, UE BOM satırlarını gerçek
 * RESERVATION hareketleri olarak kalıcı deftere işler (P14/P15 portları,
 * audit + timeline + outbox persistReservation içinde).
 *
 * Satır bazında sonuç döner: stok kartı kalıcı envanterde yoksa veya
 * serbest stok yetersizse satır atlanır ve nedeniyle raporlanır — mevcut
 * BR-03 durum geçişi davranışı değişmez (bağlantı additive'dir).
 */
import {
  persistReservation,
  persistReservationRelease,
} from '@/domain/inventory/stock-ledger-crud.service'
import {
  queryBalance,
  queryReservationMovements,
} from '@/domain/inventory/stock-ledger-query.service'
import { queryStockCardById } from '@/domain/stock-card/stock-card-query.service'

import type { ProductionOrderLifecycleRecord } from './lifecycle-types'
import { queryProductionOrderByNo } from './production-order-query.service'

export class MaterialReservationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MaterialReservationError'
  }
}

export type MaterialReservationLineStatus =
  | 'RESERVED'
  | 'ALREADY_RESERVED'
  | 'SKIPPED_NO_STOCK_CARD'
  | 'SKIPPED_INSUFFICIENT_STOCK'

export type MaterialReservationLine = {
  stockCardId: string
  code: string
  name: string
  unit: string
  warehouseCode: string | null
  requiredQty: number
  reservedQty: number
  availableQty: number
  status: MaterialReservationLineStatus
  message?: string
  movementNo?: string
}

export type MaterialReservationResult = {
  productionOrderNo: string
  reservedCount: number
  skippedCount: number
  lines: MaterialReservationLine[]
}

const RESERVABLE_STATUSES: ProductionOrderLifecycleRecord['status'][] = [
  'Released',
  'In Production',
  'Paused',
]

function requiredQtyFor(record: ProductionOrderLifecycleRecord, consumption: number): number {
  return Math.ceil(consumption * record.plannedQty)
}

/** Bu UE için kalıcı defterde net rezerve miktar (RESERVATION − RESERVATION_RELEASE). */
function persistedReservedQty(productionOrderNo: string, stockCardId: string): number {
  return queryReservationMovements()
    .filter((m) => m.referenceNo === productionOrderNo && m.stockCardId === stockCardId)
    .reduce((sum, m) => sum + (m.type === 'RESERVATION' ? m.quantity : -m.quantity), 0)
}

function buildLineView(
  record: ProductionOrderLifecycleRecord,
  bomLine: ProductionOrderLifecycleRecord['snapshots']['bom'][number],
): MaterialReservationLine {
  const requiredQty = requiredQtyFor(record, bomLine.consumption)
  const card = queryStockCardById(bomLine.stockCardId)
  const reservedQty = persistedReservedQty(record.productionOrderNo, bomLine.stockCardId)

  if (!card) {
    return {
      stockCardId: bomLine.stockCardId,
      code: bomLine.code,
      name: bomLine.name,
      unit: bomLine.unit,
      warehouseCode: null,
      requiredQty,
      reservedQty,
      availableQty: 0,
      status: 'SKIPPED_NO_STOCK_CARD',
      message: 'Stok kartı kalıcı envanterde tanımlı değil.',
    }
  }

  const balance = queryBalance(card.id, card.warehouseCode)
  const availableQty = balance?.available ?? 0
  const status: MaterialReservationLineStatus =
    reservedQty >= requiredQty
      ? 'ALREADY_RESERVED'
      : availableQty >= requiredQty - reservedQty
        ? 'RESERVED'
        : 'SKIPPED_INSUFFICIENT_STOCK'

  return {
    stockCardId: card.id,
    code: card.code,
    name: card.name,
    unit: card.unit,
    warehouseCode: card.warehouseCode,
    requiredQty,
    reservedQty,
    availableQty,
    status,
    message:
      status === 'SKIPPED_INSUFFICIENT_STOCK'
        ? `Serbest stok yetersiz: ${availableQty} / gereken ${requiredQty - reservedQty}`
        : undefined,
  }
}

/** Salt-okur görünüm: BOM satırı bazında gereken / rezerve / serbest durumu. */
export function getMaterialReservationState(productionOrderNo: string): MaterialReservationLine[] {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) throw new MaterialReservationError(`Üretim emri bulunamadı: ${productionOrderNo}`)
  return record.snapshots.bom.map((line) => buildLineView(record, line))
}

/**
 * BOM rezervasyonunu kalıcı stok defterine işler. İdempotenttir: zaten
 * rezerve edilmiş satırlar tekrar rezerve edilmez, eksik kalan miktar
 * tamamlanır.
 */
export function persistMaterialReservationForOrder(
  productionOrderNo: string,
  actor: string,
): MaterialReservationResult {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) throw new MaterialReservationError(`Üretim emri bulunamadı: ${productionOrderNo}`)
  if (!RESERVABLE_STATUSES.includes(record.status)) {
    throw new MaterialReservationError(
      `Rezervasyon yalnızca Released / In Production / Paused durumunda işlenebilir (mevcut: ${record.status}).`,
    )
  }

  const lines: MaterialReservationLine[] = []
  let reservedCount = 0
  let skippedCount = 0

  for (const bomLine of record.snapshots.bom) {
    const view = buildLineView(record, bomLine)
    if (view.status === 'RESERVED' && view.warehouseCode) {
      const qtyToReserve = view.requiredQty - view.reservedQty
      const result = persistReservation(
        {
          stockCardId: view.stockCardId,
          warehouseCode: view.warehouseCode,
          quantity: qtyToReserve,
          referenceType: 'PRODUCTION',
          referenceId: record.id,
          referenceNo: record.productionOrderNo,
          reason: `BR-03 malzeme rezervasyonu — ${record.productionOrderNo}`,
        },
        actor,
      )
      reservedCount += 1
      lines.push({
        ...view,
        reservedQty: view.reservedQty + qtyToReserve,
        movementNo: result.movement.movementNo,
      })
    } else {
      if (view.status !== 'ALREADY_RESERVED') skippedCount += 1
      lines.push(view)
    }
  }

  return { productionOrderNo, reservedCount, skippedCount, lines }
}

/** Cancel/Close akışları için: bu UE'nin kalıcı rezervlerini serbest bırakır. */
export function releaseMaterialReservationForOrder(
  productionOrderNo: string,
  actor: string,
): MaterialReservationResult {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) throw new MaterialReservationError(`Üretim emri bulunamadı: ${productionOrderNo}`)

  const lines: MaterialReservationLine[] = []
  let reservedCount = 0

  for (const bomLine of record.snapshots.bom) {
    const view = buildLineView(record, bomLine)
    if (view.reservedQty > 0 && view.warehouseCode) {
      const result = persistReservationRelease(
        {
          stockCardId: view.stockCardId,
          warehouseCode: view.warehouseCode,
          quantity: view.reservedQty,
          referenceType: 'PRODUCTION',
          referenceId: record.id,
          referenceNo: record.productionOrderNo,
          reason: `Rezervasyon çözümü — ${record.productionOrderNo}`,
        },
        actor,
      )
      reservedCount += 1
      lines.push({ ...view, reservedQty: 0, movementNo: result.movement.movementNo })
    } else {
      lines.push(view)
    }
  }

  return { productionOrderNo, reservedCount, skippedCount: 0, lines }
}
