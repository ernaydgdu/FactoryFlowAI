import { getAllAccessoryCards } from '@/domain/services/textile/accessory-management-service'
import { STOCK_CARDS } from '@/domain/data/stock-cards'
import { supplierRepository } from '@/domain/master-data'

import type { AccessoryCardListItemDto, AccessoryKpisDto, AccessoryStockItemDto } from './accessory-card.dto'
import type { StatusBadgeDto } from '../core/types'

function accessoryStatus(): StatusBadgeDto {
  return { label: 'Aktif', tone: 'success' }
}

export function mapAccessoryCardList(): AccessoryCardListItemDto[] {
  return getAllAccessoryCards().map((a) => {
    const supplier = supplierRepository.getById(a.supplierId)
    return {
      id: a.id,
      code: a.code,
      name: a.name,
      category: a.categoryCode,
      supplier: supplier?.name ?? '—',
      unit: a.unit,
      leadTimeDays: a.leadTimeDays,
      status: accessoryStatus(),
    }
  })
}

export function mapAccessoryStock(): AccessoryStockItemDto[] {
  const accessoryCategories = ['Fermuar', 'Düğme', 'İplik', 'Etiket', 'Dokuma Etiket', 'Poşet', 'Karton', 'Askı', 'Koli']
  return STOCK_CARDS.filter((s) => accessoryCategories.includes(s.category)).map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    category: s.category,
    availableQty: s.availableQty,
    unit: s.unit,
  }))
}

export function mapAccessoryKpis(): AccessoryKpisDto {
  const cards = getAllAccessoryCards()
  const stock = mapAccessoryStock()
  return {
    items: [
      { label: 'Aksesuar Kartı', value: String(cards.length), hint: 'Tanımlı' },
      { label: 'Kategori', value: String(new Set(cards.map((c) => c.categoryCode)).size), hint: 'Farklı tip' },
      { label: 'Stok Kalemi', value: String(stock.length), hint: 'Depoda' },
      { label: 'Toplam Adet', value: stock.reduce((s, x) => s + x.availableQty, 0).toLocaleString('tr-TR'), hint: 'Kullanılabilir' },
    ],
  }
}
