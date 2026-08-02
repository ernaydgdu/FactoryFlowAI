import { buildWarehouseHierarchy } from '@/domain/services/textile/warehouse-hierarchy-service'
import { warehouseRepository } from '@/domain/master-data'
import { STOCK_CARDS } from '@/domain/data/stock-cards'

import type { WarehouseHierarchyItemDto, WarehouseKpisDto, WarehouseTransactionItemDto } from './warehouse.dto'
import type { StatusBadgeDto } from '../core/types'

function txStatus(label: string): StatusBadgeDto {
  return { label, tone: label === 'Tamamlandı' ? 'success' : label === 'Bekliyor' ? 'warning' : 'default' }
}

export function mapWarehouseHierarchy(): WarehouseHierarchyItemDto[] {
  const nodes = buildWarehouseHierarchy()
  const depthMap = new Map<string, number>()

  function depth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!
    const node = nodes.find((n) => n.id === id)
    if (!node?.parentId) { depthMap.set(id, 0); return 0 }
    const d = depth(node.parentId) + 1
    depthMap.set(id, d)
    return d
  }

  return nodes.map((n) => ({
    id: n.id,
    code: n.code,
    name: n.name,
    type: n.type,
    warehouseType: n.warehouseType ?? '—',
    parentId: n.parentId,
    depth: depth(n.id),
  }))
}

export function mapWarehouseInbound(): WarehouseTransactionItemDto[] {
  const wh = warehouseRepository.getActive()[0]
  return STOCK_CARDS.slice(0, 8).map((s, i) => ({
    id: `in-${i}`,
    date: `2026-02-${String(5 + i).padStart(2, '0')}`,
    type: 'Giriş',
    warehouse: wh?.name ?? 'Ana Depo',
    material: s.name,
    qty: Math.round(s.availableQty * 0.15),
    unit: s.unit,
    status: txStatus(i % 3 === 0 ? 'Bekliyor' : 'Tamamlandı'),
  }))
}

export function mapWarehouseOutbound(): WarehouseTransactionItemDto[] {
  const wh = warehouseRepository.getActive()[1] ?? warehouseRepository.getActive()[0]
  return STOCK_CARDS.slice(3, 11).map((s, i) => ({
    id: `out-${i}`,
    date: `2026-02-${String(8 + i).padStart(2, '0')}`,
    type: 'Çıkış',
    warehouse: wh?.name ?? 'Ana Depo',
    material: s.name,
    qty: Math.round(s.availableQty * 0.08),
    unit: s.unit,
    status: txStatus('Tamamlandı'),
  }))
}

export function mapWarehouseCount(): WarehouseTransactionItemDto[] {
  const wh = warehouseRepository.getActive()[0]
  return STOCK_CARDS.slice(0, 6).map((s, i) => ({
    id: `cnt-${i}`,
    date: `2026-02-20`,
    type: 'Sayım',
    warehouse: wh?.name ?? 'Ana Depo',
    material: s.name,
    qty: s.availableQty,
    unit: s.unit,
    status: txStatus(i % 2 === 0 ? 'Tamamlandı' : 'Bekliyor'),
  }))
}

export function mapWarehouseKpis(): WarehouseKpisDto {
  const whs = warehouseRepository.getActive()
  const stock = STOCK_CARDS
  return {
    items: [
      { label: 'Depo', value: String(whs.length), hint: 'Aktif' },
      { label: 'Stok Kalemi', value: String(stock.length), hint: 'Tüm kategoriler' },
      { label: 'Giriş (Bugün)', value: '12', hint: 'Bekleyen işlem' },
      { label: 'Doluluk', value: '%72', hint: 'Kapasite' },
    ],
  }
}
