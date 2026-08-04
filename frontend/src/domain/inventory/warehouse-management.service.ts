/**
 * Warehouse Management — read-model aggregation over the persisted Stock
 * Ledger (P14/P15) and the master-data Warehouse registry (P17). No new
 * persistence port is introduced: this layer only composes existing ports.
 */
import { warehouseRepository } from '@/domain/master-data'
import type { Warehouse } from '@/domain/master-data/types'
import type { StockMovement } from '@/domain/types/stock-ledger'

import type { WarehouseStockSummary } from './inventory.types'
import { queryStockLedgerByWarehouse, queryStockMovementsByWarehouse } from './stock-ledger-query.service'

export type WarehouseDetailView = {
  warehouse: Warehouse
  summary: WarehouseStockSummary
  recentMovements: StockMovement[]
}

function summarizeWarehouse(warehouseCode: string): WarehouseStockSummary {
  const ledger = queryStockLedgerByWarehouse(warehouseCode)
  const balances = ledger?.balances ?? []
  const movements = queryStockMovementsByWarehouse(warehouseCode)
  const lastMovementAt = movements.length > 0 ? movements[movements.length - 1].createdAt : null

  return {
    warehouseCode,
    itemCount: balances.filter((b) => b.onHand > 0 || b.reserved > 0).length,
    totalOnHand: Math.round(balances.reduce((sum, b) => sum + b.onHand, 0) * 100) / 100,
    totalReserved: Math.round(balances.reduce((sum, b) => sum + b.reserved, 0) * 100) / 100,
    totalAvailable: Math.round(balances.reduce((sum, b) => sum + b.available, 0) * 100) / 100,
    lastMovementAt,
  }
}

export function listWarehouseStockSummaries(): WarehouseStockSummary[] {
  return warehouseRepository.getActive().map((wh) => summarizeWarehouse(wh.code))
}

export function getWarehouseDetail(warehouseCode: string): WarehouseDetailView | null {
  const warehouse = warehouseRepository.getByCode(warehouseCode)
  if (!warehouse) return null
  return {
    warehouse,
    summary: summarizeWarehouse(warehouseCode),
    recentMovements: queryStockMovementsByWarehouse(warehouseCode).slice().reverse().slice(0, 50),
  }
}

export function isFinishedGoodsWarehouse(warehouseCode: string): boolean {
  return warehouseRepository.getByCode(warehouseCode)?.type === 'Mamül'
}

export function listFinishedGoodsWarehouses(): Warehouse[] {
  return warehouseRepository.getActive().filter((wh) => wh.type === 'Mamül')
}
