import { warehouseRepository } from '@/domain/master-data'
import { queryAllGoodsReceipts } from '@/domain/purchasing/goods-receipt-query.service'
import {
  queryAdjustmentMovements,
  queryAllBalances,
  queryAllStockMovements,
  queryInboundMovements,
  queryOutboundMovements,
  queryReservationMovements,
  queryStockMovementsByWarehouse,
} from '@/domain/inventory/stock-ledger-query.service'
import { mapWarehouseHierarchy } from '@/application/warehouse/warehouse.mapper'

import type {
  InventoryBalanceItemDto,
  InventoryDashboardDto,
  InventoryKpisDto,
  InventoryMovementItemDto,
} from './inventory.dto'
import { mapBalance, mapMovement } from './inventory.dto'

export function mapInventoryKpis(): InventoryKpisDto {
  const balances = queryAllBalances()
  const movements = queryAllStockMovements()
  const warehouses = warehouseRepository.getActive()
  const onHand = balances.reduce((s, b) => s + b.onHand, 0)
  const reserved = balances.reduce((s, b) => s + b.reserved, 0)
  return {
    totalWarehouses: warehouses.length,
    totalStockItems: balances.filter((b) => b.onHand > 0 || b.reserved > 0).length,
    totalOnHand: Math.round(onHand * 100) / 100,
    totalReserved: Math.round(reserved * 100) / 100,
    totalMovements: movements.length,
    items: [
      { label: 'Depo', value: String(warehouses.length), hint: 'Aktif' },
      { label: 'Stok Kalemi', value: String(balances.length), hint: 'Depo bazlı' },
      { label: 'Eldeki', value: onHand.toLocaleString('tr-TR'), hint: 'Toplam onHand' },
      { label: 'Hareket', value: String(movements.length), hint: 'Ledger kayıtları' },
    ],
  }
}

export function mapInventoryDashboard(): InventoryDashboardDto {
  const kpis = mapInventoryKpis()
  const recentMovements = queryAllStockMovements()
    .slice(-20)
    .reverse()
    .map(mapMovement)
  const lowStock = queryAllBalances()
    .filter((b) => b.available <= 0 && b.onHand > 0)
    .slice(0, 10)
    .map(mapBalance)
  return { kpis, recentMovements, lowStock }
}

export function mapInventoryBalanceList(): InventoryBalanceItemDto[] {
  return queryAllBalances().map(mapBalance)
}

export function mapInventoryMovementList(): InventoryMovementItemDto[] {
  return queryAllStockMovements()
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryInbound(): InventoryMovementItemDto[] {
  return queryInboundMovements()
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryOutbound(): InventoryMovementItemDto[] {
  return queryOutboundMovements()
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryReservations(): InventoryMovementItemDto[] {
  return queryReservationMovements()
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryAdjustments(): InventoryMovementItemDto[] {
  return queryAdjustmentMovements()
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryTransfers(): InventoryMovementItemDto[] {
  return queryAllStockMovements()
    .filter((m) => m.type === 'TRANSFER_IN' || m.type === 'TRANSFER_OUT')
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapInventoryCycleCounts(): InventoryMovementItemDto[] {
  return queryAdjustmentMovements()
    .filter((m) => m.referenceNo.startsWith('CNT-') || m.reason.includes('Sayım'))
    .slice()
    .reverse()
    .map(mapMovement)
}

export function mapWarehouseList() {
  return mapWarehouseHierarchy()
}

export function mapGoodsReceiptList() {
  return queryAllGoodsReceipts().map((gr) => ({
    id: gr.id,
    grNo: gr.grNo,
    poNo: gr.poNo,
    warehouseCode: gr.warehouseCode,
    receivedAt: gr.receivedAt,
    lineCount: gr.lines.length,
    status: gr.status,
  }))
}

export function mapMovementsByWarehouse(warehouseCode: string): InventoryMovementItemDto[] {
  return queryStockMovementsByWarehouse(warehouseCode)
    .slice()
    .reverse()
    .map(mapMovement)
}

export {
  mapInventoryKpis as mapWarehouseKpisFromInventory,
  mapInventoryInbound as mapWarehouseInboundFromInventory,
  mapInventoryOutbound as mapWarehouseOutboundFromInventory,
  mapInventoryCycleCounts as mapWarehouseCountFromInventory,
}
