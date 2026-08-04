import { warehouseRepository } from '@/domain/master-data'
import {
  getWarehouseDetail,
  listFinishedGoodsWarehouses,
  listWarehouseStockSummaries,
} from '@/domain/inventory/warehouse-management.service'

import type {
  FinishedGoodsWarehouseOptionDto,
  WarehouseDetailDto,
  WarehouseSummaryItemDto,
} from './warehouse-management.dto'

export function mapWarehouseSummaryList(): WarehouseSummaryItemDto[] {
  const summaries = listWarehouseStockSummaries()
  const byCode = new Map(summaries.map((s) => [s.warehouseCode, s]))

  return warehouseRepository.getActive().map((wh) => {
    const s = byCode.get(wh.code)
    return {
      id: wh.id,
      code: wh.code,
      name: wh.name,
      type: wh.type ?? '—',
      location: wh.location,
      status: wh.isActive ? { label: 'Aktif', tone: 'success' } : { label: 'Pasif', tone: 'default' },
      itemCount: s?.itemCount ?? 0,
      totalOnHand: s?.totalOnHand ?? 0,
      totalReserved: s?.totalReserved ?? 0,
      totalAvailable: s?.totalAvailable ?? 0,
      lastMovementAt: s?.lastMovementAt ?? null,
    }
  })
}

export function mapWarehouseDetail(warehouseCode: string): WarehouseDetailDto | null {
  const view = getWarehouseDetail(warehouseCode)
  if (!view) return null
  const { warehouse: wh, summary, recentMovements } = view

  return {
    id: wh.id,
    code: wh.code,
    name: wh.name,
    type: wh.type ?? '—',
    location: wh.location,
    status: wh.isActive ? { label: 'Aktif', tone: 'success' } : { label: 'Pasif', tone: 'default' },
    itemCount: summary.itemCount,
    totalOnHand: summary.totalOnHand,
    totalReserved: summary.totalReserved,
    totalAvailable: summary.totalAvailable,
    lastMovementAt: summary.lastMovementAt,
    recentMovements: recentMovements.map((m) => ({
      id: m.id,
      date: m.createdAt,
      movementNo: m.movementNo,
      type: m.type,
      material: `${m.materialCode} — ${m.materialName}`,
      qty: m.quantity,
      unit: m.unit,
      referenceNo: m.referenceNo,
    })),
  }
}

export function mapFinishedGoodsWarehouseOptions(): FinishedGoodsWarehouseOptionDto[] {
  return listFinishedGoodsWarehouses().map((wh) => ({ code: wh.code, name: wh.name }))
}
