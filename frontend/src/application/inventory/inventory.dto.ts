import type { KpiDto, StatusBadgeDto } from '../core/types'
import type { InventoryBalanceView } from '@/domain/inventory/inventory.types'
import type { StockMovement } from '@/domain/types/stock-ledger'

export type InventoryKpisDto = {
  totalWarehouses: number
  totalStockItems: number
  totalOnHand: number
  totalReserved: number
  totalMovements: number
  items: KpiDto[]
}

export type InventoryMovementItemDto = {
  id: string
  movementNo: string
  date: string
  type: string
  typeLabel: string
  material: string
  materialCode: string
  qty: number
  unit: string
  warehouse: string
  warehouseCode: string
  referenceNo: string
  reason: string
  onHandAfter?: number
  reservedAfter?: number
  status: StatusBadgeDto
}

export type InventoryBalanceItemDto = InventoryBalanceView & {
  id: string
}

export type InventoryDashboardDto = {
  kpis: InventoryKpisDto
  recentMovements: InventoryMovementItemDto[]
  lowStock: InventoryBalanceItemDto[]
}

const MOVEMENT_LABELS: Record<string, string> = {
  RECEIPT: 'Giriş',
  TRANSFER_IN: 'Transfer Giriş',
  TRANSFER_OUT: 'Transfer Çıkış',
  CONSUMPTION: 'Çıkış',
  RESERVATION: 'Rezervasyon',
  RESERVATION_RELEASE: 'Rezervasyon Çözüm',
  ADJUSTMENT: 'Düzeltme',
  PRODUCTION_OUTPUT: 'Üretim Giriş',
  SHIPMENT: 'Sevkiyat',
  WASTE: 'Fire',
}

export function movementTypeLabel(type: string): string {
  return MOVEMENT_LABELS[type] ?? type
}

export function movementStatus(type: string): StatusBadgeDto {
  if (type === 'RECEIPT' || type === 'TRANSFER_IN' || type === 'PRODUCTION_OUTPUT') {
    return { label: 'Giriş', tone: 'success' }
  }
  if (type === 'CONSUMPTION' || type === 'TRANSFER_OUT' || type === 'SHIPMENT') {
    return { label: 'Çıkış', tone: 'warning' }
  }
  if (type === 'RESERVATION') return { label: 'Rezerve', tone: 'default' }
  if (type === 'ADJUSTMENT') return { label: 'Düzeltme', tone: 'default' }
  return { label: 'Tamamlandı', tone: 'success' }
}

export function mapMovement(row: StockMovement): InventoryMovementItemDto {
  return {
    id: row.id,
    movementNo: row.movementNo,
    date: row.createdAt.slice(0, 10),
    type: row.type,
    typeLabel: movementTypeLabel(row.type),
    material: row.materialName,
    materialCode: row.materialCode,
    qty: row.quantity,
    unit: row.unit,
    warehouse: row.warehouseName,
    warehouseCode: row.warehouseCode,
    referenceNo: row.referenceNo,
    reason: row.reason,
    onHandAfter: row.onHandAfter,
    reservedAfter: row.reservedAfter,
    status: movementStatus(row.type),
  }
}

export function mapBalance(row: InventoryBalanceView): InventoryBalanceItemDto {
  return { ...row, id: `${row.stockCardId}-${row.warehouseCode}` }
}
