import type { MaterialStatus, ProductionStatus, QuickFilter, StageStatus } from './types'

export const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'Hepsi' },
  { id: 'termin-risk', label: 'Termin Riski' },
  { id: 'in-production', label: 'Üretimde' },
  { id: 'waiting', label: 'Beklemede' },
  { id: 'completed', label: 'Tamamlandı' },
]

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export const productionStatusTone: Record<
  ProductionStatus,
  'muted' | 'default' | 'success' | 'warning'
> = {
  Beklemede: 'muted',
  Üretimde: 'default',
  Tamamlandı: 'success',
  'Sevk Edildi': 'success',
}

export const materialStatusTone: Record<
  MaterialStatus,
  'success' | 'warning' | 'danger' | 'muted'
> = {
  Hazır: 'success',
  Kısmi: 'warning',
  Eksik: 'danger',
  Bekliyor: 'muted',
}

export const stageStatusTone: Record<
  StageStatus,
  'success' | 'default' | 'muted'
> = {
  Tamamlandı: 'success',
  'Devam Ediyor': 'default',
  Bekliyor: 'muted',
  '—': 'muted',
}

export const ORDER_TABLE_COLUMNS = [
  { key: 'orderNo', label: 'Sipariş No', sortable: true },
  { key: 'customer', label: 'Müşteri', sortable: true, filterKey: 'customer' as const },
  { key: 'brand', label: 'Marka', sortable: true, filterKey: 'brand' as const },
  { key: 'model', label: 'Model', sortable: true },
  { key: 'season', label: 'Sezon', sortable: true, filterKey: 'season' as const },
  { key: 'color', label: 'Renk', sortable: true },
  { key: 'sizeSet', label: 'Beden Seti', sortable: false },
  { key: 'totalQuantity', label: 'Toplam Adet', sortable: true },
  { key: 'exfDate', label: 'Termin (EXF)', sortable: true },
  { key: 'productionStatus', label: 'Üretim Durumu', sortable: true, filterKey: 'productionStatus' as const },
  { key: 'fabricStatus', label: 'Kumaş Durumu', sortable: false, filterKey: 'fabricStatus' as const },
  { key: 'accessoryStatus', label: 'Aksesuar Durumu', sortable: false, filterKey: 'accessoryStatus' as const },
  { key: 'cuttingStatus', label: 'Kesim', sortable: false },
  { key: 'sewingStatus', label: 'Dikim', sortable: false },
  { key: 'packingStatus', label: 'Paket', sortable: false },
  { key: 'shippingStatus', label: 'Sevkiyat', sortable: false },
  { key: 'progress', label: 'İlerleme %', sortable: true },
  { key: 'planner', label: 'Sorumlu Planlamacı', sortable: true, filterKey: 'planner' as const },
  { key: 'actions', label: 'İşlemler', sortable: false },
] as const
