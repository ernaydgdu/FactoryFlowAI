import { getStockCardById } from '../data/stock-cards'
import { getWarehouseByCode } from '../data/warehouses'
import type { StockCard } from '../types'
import type {
  StockBalance,
  StockLedger,
  StockMovement,
  StockMovementType,
  StockReferenceType,
} from '../types/stock-ledger'

export function createEmptyLedger(): StockLedger {
  return { movements: [], balances: [], lastMovementNo: 0 }
}

function resolveStockCard(stockCardId: string): StockCard {
  const card = getStockCardById(stockCardId)
  if (card) return card

  if (stockCardId.startsWith('fg-')) {
    const orderNo = stockCardId.replace('fg-', '')
    return {
      id: stockCardId,
      code: stockCardId,
      name: `Mamül — ${orderNo}`,
      category: 'Koli',
      unit: 'adet',
      warehouseCode: 'MML-01',
      warehouseName: 'Mamül Deposu',
      supplier: '—',
      leadTimeDays: 0,
      minOrderQty: 0,
      availableQty: 0,
      attributes: { orderNo },
    }
  }

  throw new Error(`Stok kartı bulunamadı: ${stockCardId}`)
}

function getOrCreateBalance(
  ledger: StockLedger,
  stockCardId: string,
  warehouseCode: string,
): StockBalance {
  const existing = ledger.balances.find(
    (b) => b.stockCardId === stockCardId && b.warehouseCode === warehouseCode,
  )
  if (existing) return existing

  const card = resolveStockCard(stockCardId)
  const wh = getWarehouseByCode(warehouseCode)
  const balance: StockBalance = {
    stockCardId,
    materialCode: card.code,
    warehouseCode,
    warehouseName: wh?.name ?? warehouseCode,
    unit: card.unit,
    onHand: 0,
    reserved: 0,
    available: 0,
  }
  ledger.balances.push(balance)
  return balance
}

function syncAvailable(balance: StockBalance): void {
  balance.available = Math.round((balance.onHand - balance.reserved) * 10000) / 10000
}

function nextMovementNo(ledger: StockLedger): string {
  ledger.lastMovementNo += 1
  return `STK-${String(ledger.lastMovementNo).padStart(6, '0')}`
}

export type CreateMovementInput = {
  type: StockMovementType
  stockCardId: string
  warehouseCode: string
  quantity: number
  referenceType: StockReferenceType
  referenceId: string
  referenceNo: string
  reason: string
  createdBy: string
  linkedMovementId?: string
  createdAt?: string
}

/**
 * Tek hareket oluşturur ve bakiyeyi günceller.
 * Stok doğrudan değiştirilmez — yalnızca bu fonksiyon üzerinden.
 */
export function recordMovement(
  ledger: StockLedger,
  input: CreateMovementInput,
): StockMovement {
  const card = resolveStockCard(input.stockCardId)
  const wh = getWarehouseByCode(input.warehouseCode)
  if (!wh) throw new Error(`Depo bulunamadı: ${input.warehouseCode}`)
  if (input.quantity <= 0) throw new Error('Hareket miktarı sıfırdan büyük olmalı')

  const balance = getOrCreateBalance(ledger, input.stockCardId, input.warehouseCode)

  switch (input.type) {
    case 'RECEIPT':
    case 'TRANSFER_IN':
    case 'PRODUCTION_OUTPUT':
      balance.onHand += input.quantity
      break
    case 'TRANSFER_OUT':
    case 'CONSUMPTION':
    case 'WASTE':
    case 'SHIPMENT':
      if (balance.onHand < input.quantity) {
        throw new Error(
          `${balance.materialCode} @ ${balance.warehouseName}: yetersiz stok (${balance.onHand} < ${input.quantity})`,
        )
      }
      balance.onHand -= input.quantity
      break
    case 'RESERVATION':
      if (balance.available < input.quantity) {
        throw new Error(
          `${balance.materialCode} @ ${balance.warehouseName}: rezerve için yetersiz serbest stok`,
        )
      }
      balance.reserved += input.quantity
      break
    case 'RESERVATION_RELEASE':
      if (balance.reserved < input.quantity) {
        throw new Error(`${balance.materialCode}: rezerve çözüm miktarı fazla`)
      }
      balance.reserved -= input.quantity
      break
    case 'ADJUSTMENT':
      balance.onHand += input.quantity
      break
    default:
      throw new Error(`Desteklenmeyen hareket tipi: ${input.type}`)
  }

  syncAvailable(balance)

  const movement: StockMovement = {
    id: `mov-${ledger.movements.length + 1}`,
    movementNo: nextMovementNo(ledger),
    type: input.type,
    stockCardId: input.stockCardId,
    materialCode: card.code,
    materialName: card.name,
    warehouseCode: wh.code,
    warehouseName: wh.name,
    quantity: input.quantity,
    unit: card.unit,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNo: input.referenceNo,
    reason: input.reason,
    createdAt: input.createdAt ?? new Date().toISOString(),
    createdBy: input.createdBy,
    linkedMovementId: input.linkedMovementId,
    onHandAfter: balance.onHand,
    reservedAfter: balance.reserved,
  }

  ledger.movements.push(movement)
  return movement
}

export function getBalance(
  ledger: StockLedger,
  stockCardId: string,
  warehouseCode: string,
): StockBalance | undefined {
  return ledger.balances.find(
    (b) => b.stockCardId === stockCardId && b.warehouseCode === warehouseCode,
  )
}

export function getMovementsByReference(
  ledger: StockLedger,
  referenceId: string,
): StockMovement[] {
  return ledger.movements.filter((m) => m.referenceId === referenceId)
}

export function rebuildBalancesFromMovements(movements: StockMovement[]): StockBalance[] {
  const ledger = createEmptyLedger()
  for (const m of movements) {
    recordMovement(ledger, {
      type: m.type,
      stockCardId: m.stockCardId,
      warehouseCode: m.warehouseCode,
      quantity: m.quantity,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      referenceNo: m.referenceNo,
      reason: m.reason,
      createdBy: m.createdBy,
      linkedMovementId: m.linkedMovementId,
      createdAt: m.createdAt,
    })
  }
  return ledger.balances
}

/** BR-10: Ledger bütünlük kontrolü — bakiye = hareketlerin toplamı */
export function validateLedgerIntegrity(ledger: StockLedger): { valid: boolean; errors: string[] } {
  const rebuilt = rebuildBalancesFromMovements(ledger.movements)
  const errors: string[] = []

  for (const balance of ledger.balances) {
    const expected = rebuilt.find(
      (b) =>
        b.stockCardId === balance.stockCardId &&
        b.warehouseCode === balance.warehouseCode,
    )
    if (!expected) {
      errors.push(`Bakiye hareketsiz: ${balance.materialCode} @ ${balance.warehouseCode}`)
      continue
    }
    if (expected.onHand !== balance.onHand || expected.reserved !== balance.reserved) {
      errors.push(
        `Bakiye uyumsuz: ${balance.materialCode} @ ${balance.warehouseCode} ` +
          `(beklenen onHand=${expected.onHand}, reserved=${expected.reserved})`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}
