export type ProductionStatus =
  | 'Beklemede'
  | 'Üretimde'
  | 'Tamamlandı'
  | 'Sevk Edildi'

export type MaterialStatus = 'Hazır' | 'Kısmi' | 'Eksik' | 'Bekliyor'

export type StageStatus = 'Tamamlandı' | 'Devam Ediyor' | 'Bekliyor' | '—'

export type QuickFilter =
  | 'all'
  | 'termin-risk'
  | 'in-production'
  | 'waiting'
  | 'completed'
  | 'cutting-ready'

export type Order = {
  id: string
  orderNo: string
  customer: string
  brand: string
  model: string
  season: string
  color: string
  sizeSet: string
  totalQuantity: number
  exfDate: string
  exfTimestamp: number
  productionStatus: ProductionStatus
  fabricStatus: MaterialStatus
  accessoryStatus: MaterialStatus
  cuttingStatus: StageStatus
  sewingStatus: StageStatus
  packingStatus: StageStatus
  shippingStatus: StageStatus
  progress: number
  planner: string
  terminRisk: boolean
  productType: string | null
  materialWarning: boolean
  colorCount: number
  colorSizeTotal: number
  cuttingReady: boolean
}

export type OrderSortKey = keyof Pick<
  Order,
  | 'orderNo'
  | 'customer'
  | 'brand'
  | 'model'
  | 'season'
  | 'color'
  | 'totalQuantity'
  | 'exfTimestamp'
  | 'productionStatus'
  | 'progress'
  | 'planner'
>

export type SortDirection = 'asc' | 'desc'

export type ColumnFilterKey =
  | 'customer'
  | 'brand'
  | 'season'
  | 'productionStatus'
  | 'fabricStatus'
  | 'accessoryStatus'
  | 'planner'

export type ColumnFilters = Partial<Record<ColumnFilterKey, string>>

export type OrderListKpis = {
  total: number
  inProduction: number
  terminRisk: number
  completed: number
  waiting: number
  cuttingReady: number
}
