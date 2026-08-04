/**
 * Stock Ledger CRUD — immutable movement write path (P14 + P15).
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { warehouseRepository } from '@/domain/master-data'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedStockLedger, PersistedStockMovement } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockLedgerRepository } from '@/domain/ports/persistence/aggregates/stock-ledger.repository'
import type { IStockMovementStreamRepository } from '@/domain/ports/persistence/streams/stock-movement-stream.repository'
import { scheduleInventoryChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { queryStockCardByCode, queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type { StockMovement } from '@/domain/types/stock-ledger'

import type {
  CycleCountInput,
  FinishedGoodsReceiptInput,
  GoodsIssueInput,
  GoodsReceiptLedgerInput,
  InventoryMovementResult,
  StockAdjustmentInput,
  StockReservationInput,
  StockTransferInput,
} from './inventory.types'
import { ledgerFromBalances, recordPersistedMovement } from './stock-ledger-engine.service'
import { queryStockLedgerByWarehouse } from './stock-ledger-query.service'

export class InventoryDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryDomainError'
  }
}

function ledgerRepo(): IStockLedgerRepository {
  return requireUnitOfWork().stockLedgers
}

function movementRepo(): IStockMovementStreamRepository {
  return requireUnitOfWork().stockMovements
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function ensureLedger(warehouseCode: string): PersistedStockLedger {
  const existing = ledgerRepo().findByWarehouseCode(DEFAULT_TENANT_ID, warehouseCode)
  if (existing) return existing
  const wh = warehouseRepository.getByCode(warehouseCode)
  if (!wh) throw new InventoryDomainError(`Depo bulunamadı: ${warehouseCode}`)
  const now = new Date().toISOString()
  const ledger: PersistedStockLedger = {
    id: warehouseCode,
    warehouseCode,
    balances: [],
    lastMovementNo: 0,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  return ledgerRepo().save(DEFAULT_TENANT_ID, ledger)
}

function appendMovement(ledgerId: string, movement: StockMovement): void {
  const persisted: PersistedStockMovement = {
    ...movement,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'stock_movement',
    streamId: ledgerId,
    sequence: 0,
  }
  movementRepo().append(DEFAULT_TENANT_ID, { streamType: 'stock_movement', streamId: ledgerId }, [persisted])
}

function saveLedgerMovement(
  warehouseCode: string,
  movement: StockMovement,
  ledgerState: ReturnType<typeof ledgerFromBalances>,
  actorUserId: string,
  changeType: string,
): InventoryMovementResult {
  const now = new Date().toISOString()
  const existing = ensureLedger(warehouseCode)
  const saved = ledgerRepo().save(DEFAULT_TENANT_ID, {
    ...existing,
    balances: ledgerState.balances,
    lastMovementNo: ledgerState.lastMovementNo,
    updatedAt: now,
  })
  appendMovement(saved.id, movement)

  logAudit(
    'StockMovement',
    movement.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `${movement.movementNo} — ${movement.type}` },
    null,
    {
      movementNo: movement.movementNo,
      type: movement.type,
      warehouseCode,
      materialCode: movement.materialCode,
      quantity: movement.quantity,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-stk-${movement.id}-${Date.now()}`,
    entityType: 'WAREHOUSE',
    entityId: saved.id,
    entityCode: warehouseCode,
    occurredAt: now,
    actor: actorUserId,
    action: movement.type,
    reason: movement.reason,
  })
  scheduleInventoryChange({
    entityType: 'StockMovement',
    entityId: movement.id,
    entityNo: movement.movementNo,
    warehouseCode,
    movementType: movement.type,
    changeType,
    occurredAt: now,
    actorUserId,
  })

  return { movement, warehouseCode }
}

function postSingleMovement(
  warehouseCode: string,
  input: {
    type: StockMovement['type']
    stockCardId: string
    quantity: number
    referenceType: StockMovement['referenceType']
    referenceId: string
    referenceNo: string
    reason: string
    linkedMovementId?: string
  },
  actorUserId: string,
  changeType: string,
): InventoryMovementResult {
  const ledgerRow = ensureLedger(warehouseCode)
  const state = ledgerFromBalances(ledgerRow.balances, ledgerRow.lastMovementNo)
  const movement = recordPersistedMovement(state, {
    ...input,
    warehouseCode,
    createdBy: actorUserId,
  })
  return saveLedgerMovement(warehouseCode, movement, state, actorUserId, changeType)
}

export function persistGoodsReceiptToLedger(
  input: GoodsReceiptLedgerInput,
  actorUserId: string,
): InventoryMovementResult[] {
  const results: InventoryMovementResult[] = []
  for (const line of input.lines) {
    const card = queryStockCardById(line.stockCardId) ?? queryStockCardByCode(line.materialCode)
    if (!card) throw new InventoryDomainError(`Stok kartı bulunamadı: ${line.materialCode}`)
    results.push(
      postSingleMovement(
        input.warehouseCode,
        {
          type: 'RECEIPT',
          stockCardId: card.id,
          quantity: line.quantity,
          referenceType: 'PO',
          referenceId: input.goodsReceiptId,
          referenceNo: input.grNo,
          reason: `Mal kabul — ${input.poNo}`,
        },
        actorUserId,
        'GoodsReceipt',
      ),
    )
  }
  return results
}

export function persistGoodsIssue(input: GoodsIssueInput, actorUserId: string): InventoryMovementResult {
  return postSingleMovement(
    input.warehouseCode,
    {
      type: 'CONSUMPTION',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
    },
    actorUserId,
    'GoodsIssue',
  )
}

export function persistStockTransfer(
  input: StockTransferInput,
  actorUserId: string,
): InventoryMovementResult {
  if (input.fromWarehouseCode === input.toWarehouseCode) {
    throw new InventoryDomainError('Kaynak ve hedef depo aynı olamaz.')
  }
  const outResult = postSingleMovement(
    input.fromWarehouseCode,
    {
      type: 'TRANSFER_OUT',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: 'TRANSFER',
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
    },
    actorUserId,
    'TransferOut',
  )
  const inResult = postSingleMovement(
    input.toWarehouseCode,
    {
      type: 'TRANSFER_IN',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: 'TRANSFER',
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
      linkedMovementId: outResult.movement.id,
    },
    actorUserId,
    'TransferIn',
  )
  return { ...inResult, linkedMovement: outResult.movement }
}

export function persistReservation(
  input: StockReservationInput,
  actorUserId: string,
): InventoryMovementResult {
  return postSingleMovement(
    input.warehouseCode,
    {
      type: 'RESERVATION',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
    },
    actorUserId,
    'Reservation',
  )
}

export function persistReservationRelease(
  input: StockReservationInput,
  actorUserId: string,
): InventoryMovementResult {
  return postSingleMovement(
    input.warehouseCode,
    {
      type: 'RESERVATION_RELEASE',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
    },
    actorUserId,
    'ReservationRelease',
  )
}

export function persistStockAdjustment(
  input: StockAdjustmentInput,
  actorUserId: string,
): InventoryMovementResult {
  if (input.quantity === 0) throw new InventoryDomainError('Düzeltme miktarı sıfır olamaz.')
  return postSingleMovement(
    input.warehouseCode,
    {
      type: 'ADJUSTMENT',
      stockCardId: input.stockCardId,
      quantity: input.quantity,
      referenceType: 'TRANSFER',
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: input.reason,
    },
    actorUserId,
    'Adjustment',
  )
}

export function persistCycleCount(input: CycleCountInput, actorUserId: string): InventoryMovementResult {
  const ledgerRow = queryStockLedgerByWarehouse(input.warehouseCode)
  const current = ledgerRow?.balances.find((b) => b.stockCardId === input.stockCardId)
  const onHand = current?.onHand ?? 0
  const delta = Math.round((input.countedQty - onHand) * 100) / 100
  if (delta === 0) throw new InventoryDomainError('Sayım farkı yok — düzeltme gerekmez.')
  return persistStockAdjustment(
    {
      stockCardId: input.stockCardId,
      warehouseCode: input.warehouseCode,
      quantity: delta,
      referenceId: input.countNo,
      referenceNo: input.countNo,
      reason: input.reason ?? `Sayım düzeltmesi — ${input.countNo}`,
    },
    actorUserId,
  )
}

/**
 * Mamül depo tanımı — Production Order çıktısını gerçek, denetlenebilir
 * (audit + timeline + outbox) bir PRODUCTION_OUTPUT hareketi olarak Mamül
 * deposuna kaydeder. Stok kartı olmayan mamüller `fg-<UE No>` sentetik
 * kimliği ile temsil edilir (resolveStockCard'daki mevcut kural).
 */
export function persistFinishedGoodsReceipt(
  input: FinishedGoodsReceiptInput,
  actorUserId: string,
): InventoryMovementResult {
  if (input.quantity <= 0) throw new InventoryDomainError('Mamül miktarı sıfırdan büyük olmalı.')
  const wh = warehouseRepository.getByCode(input.warehouseCode)
  if (!wh) throw new InventoryDomainError(`Depo bulunamadı: ${input.warehouseCode}`)
  if (wh.type !== 'Mamül') {
    throw new InventoryDomainError(`${input.warehouseCode} bir mamül deposu değil.`)
  }
  return postSingleMovement(
    input.warehouseCode,
    {
      type: 'PRODUCTION_OUTPUT',
      stockCardId: `fg-${input.productionOrderNo}`,
      quantity: input.quantity,
      referenceType: 'PRODUCTION',
      referenceId: input.productionOrderId,
      referenceNo: input.productionOrderNo,
      reason: input.reason ?? `Mamül kabul — ${input.productionOrderNo}`,
    },
    actorUserId,
    'FinishedGoodsReceipt',
  )
}

export function persistOpeningBalance(
  stockCardId: string,
  warehouseCode: string,
  quantity: number,
  actorUserId: string,
): InventoryMovementResult | null {
  if (quantity <= 0) return null
  return persistStockAdjustment(
    {
      stockCardId,
      warehouseCode,
      quantity,
      referenceId: 'opening-balance',
      referenceNo: 'OPENING',
      reason: 'Açılış bakiyesi',
    },
    actorUserId,
  )
}
