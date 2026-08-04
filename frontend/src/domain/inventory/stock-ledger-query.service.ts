/**
 * Stock Ledger query — read path via repository ports.
 */
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedStockLedger, PersistedStockMovement } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockLedgerRepository } from '@/domain/ports/persistence/aggregates/stock-ledger.repository'
import type { IStockMovementStreamRepository } from '@/domain/ports/persistence/streams/stock-movement-stream.repository'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import { queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type { StockBalance, StockMovement } from '@/domain/types/stock-ledger'

import type { InventoryBalanceView } from './inventory.types'

function ledgerRepo(): IStockLedgerRepository {
  return requireUnitOfWork().stockLedgers
}

function movementRepo(): IStockMovementStreamRepository {
  return requireUnitOfWork().stockMovements
}

function stripMovement(row: PersistedStockMovement): StockMovement {
  const {
    tenantId: _t,
    streamType: _st,
    streamId: _si,
    sequence: _seq,
    ...movement
  } = row
  return movement as StockMovement
}

export function queryAllStockLedgers(): PersistedStockLedger[] {
  const page = ledgerRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items
}

export function queryStockLedgerByWarehouse(warehouseCode: string): PersistedStockLedger | null {
  return ledgerRepo().findByWarehouseCode(DEFAULT_TENANT_ID, warehouseCode)
}

export function queryAllStockMovements(): StockMovement[] {
  const page = movementRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripMovement)
}

export function queryStockMovementsByWarehouse(warehouseCode: string): StockMovement[] {
  const page = movementRepo().cursorByLedgerId(
    DEFAULT_TENANT_ID,
    warehouseCode,
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(stripMovement)
}

export function queryStockMovementsByType(type: StockMovement['type']): StockMovement[] {
  const page = movementRepo().cursor(DEFAULT_TENANT_ID, { type }, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripMovement)
}

export function queryStockMovementsByStockCard(stockCardId: string): StockMovement[] {
  const page = movementRepo().cursorByStockCardId(
    DEFAULT_TENANT_ID,
    stockCardId,
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(stripMovement)
}

export function queryAllBalances(): InventoryBalanceView[] {
  const ledgers = queryAllStockLedgers()
  const views: InventoryBalanceView[] = []
  for (const ledger of ledgers) {
    for (const balance of ledger.balances) {
      const card = queryStockCardById(balance.stockCardId)
      views.push({
        stockCardId: balance.stockCardId,
        materialCode: balance.materialCode,
        materialName: card?.name ?? balance.materialCode,
        warehouseCode: balance.warehouseCode,
        warehouseName: balance.warehouseName,
        unit: balance.unit,
        onHand: balance.onHand,
        reserved: balance.reserved,
        available: balance.available,
      })
    }
  }
  return views.sort((a, b) => a.materialCode.localeCompare(b.materialCode))
}

export function queryBalance(
  stockCardId: string,
  warehouseCode: string,
): StockBalance | null {
  const ledger = queryStockLedgerByWarehouse(warehouseCode)
  return ledger?.balances.find((b) => b.stockCardId === stockCardId) ?? null
}

export function queryInboundMovements(): StockMovement[] {
  return queryAllStockMovements().filter((m) => m.type === 'RECEIPT' || m.type === 'TRANSFER_IN')
}

export function queryOutboundMovements(): StockMovement[] {
  return queryAllStockMovements().filter(
    (m) => m.type === 'CONSUMPTION' || m.type === 'TRANSFER_OUT' || m.type === 'SHIPMENT',
  )
}

export function queryReservationMovements(): StockMovement[] {
  return queryAllStockMovements().filter(
    (m) => m.type === 'RESERVATION' || m.type === 'RESERVATION_RELEASE',
  )
}

export function queryAdjustmentMovements(): StockMovement[] {
  return queryAllStockMovements().filter((m) => m.type === 'ADJUSTMENT')
}
