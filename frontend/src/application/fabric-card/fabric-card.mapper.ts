import { STOCK_CARDS } from '@/domain/data/stock-cards'
import { getAllFabricCards } from '@/domain/services/textile/fabric-management-service'
import {
  fabricCompositionRepository,
  fabricTypeRepository,
  supplierRepository,
} from '@/domain/master-data'

import type {
  FabricCardListItemDto,
  FabricKpisDto,
  FabricMovementItemDto,
  FabricStockItemDto,
} from './fabric-card.dto'
import type { StatusBadgeDto } from '../core/types'

function fabricStatus(status: string): StatusBadgeDto {
  return { label: status, tone: status === 'Aktif' ? 'success' : 'muted' }
}

export function mapFabricCardList(): FabricCardListItemDto[] {
  return getAllFabricCards().map((f) => {
    const comp = fabricCompositionRepository.getById(f.compositionId)
    const supplier = supplierRepository.getById(f.supplierId)
    const ft = fabricTypeRepository.getById(f.fabricTypeId)
    return {
      id: f.id,
      code: f.code,
      name: f.name,
      composition: comp?.fiberContent ?? '—',
      width: `${f.widthCm} cm`,
      weight: `${f.weightGsm} g/m²`,
      supplier: supplier?.name ?? '—',
      color: ft?.name ?? '—',
      status: fabricStatus('Aktif'),
    }
  })
}

export function mapFabricStock(): FabricStockItemDto[] {
  return STOCK_CARDS.filter((s) => s.category === 'Kumaş').map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    lot: s.lot ?? '—',
    availableQty: s.availableQty,
    unit: s.unit,
    warehouse: s.warehouseName,
  }))
}

export function mapFabricMovements(): FabricMovementItemDto[] {
  const stock = mapFabricStock()
  return stock.slice(0, 12).map((s, i) => ({
    id: `fm-${i}`,
    date: `2026-02-${String(10 + i).padStart(2, '0')}`,
    type: i % 2 === 0 ? 'Giriş' : 'Çıkış',
    material: s.name,
    qty: Math.round(s.availableQty * 0.1),
    unit: s.unit,
    reference: `REF-${1000 + i}`,
  }))
}

export function mapFabricKpis(): FabricKpisDto {
  const cards = getAllFabricCards()
  const stock = mapFabricStock()
  return {
    items: [
      { label: 'Kumaş Kartı', value: String(cards.length), hint: 'Tanımlı' },
      { label: 'Stok Kalemi', value: String(stock.length), hint: 'Aktif lot' },
      { label: 'Toplam Stok', value: `${stock.reduce((s, x) => s + x.availableQty, 0).toLocaleString('tr-TR')} m`, hint: 'Kullanılabilir' },
      { label: 'Tedarikçi', value: String(supplierRepository.getActive().filter((s) => s.categoryCode === 'FABRIC' || s.category === 'Kumaş').length), hint: 'Onaylı' },
    ],
  }
}
