import type { KpiDto, StatusBadgeDto } from '../core/types'

export type AccessoryCardListItemDto = {
  id: string
  code: string
  name: string
  category: string
  supplier: string
  unit: string
  leadTimeDays: number
  status: StatusBadgeDto
}

export type AccessoryStockItemDto = {
  id: string
  code: string
  name: string
  category: string
  availableQty: number
  unit: string
}

export type AccessoryKpisDto = { items: KpiDto[] }
