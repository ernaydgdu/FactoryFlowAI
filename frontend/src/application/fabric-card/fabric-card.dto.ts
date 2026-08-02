import type { KpiDto, StatusBadgeDto } from '../core/types'

export type FabricCardListItemDto = {
  id: string
  code: string
  name: string
  composition: string
  width: string
  weight: string
  supplier: string
  color: string
  status: StatusBadgeDto
}

export type FabricStockItemDto = {
  id: string
  code: string
  name: string
  lot: string
  availableQty: number
  unit: string
  warehouse: string
}

export type FabricMovementItemDto = {
  id: string
  date: string
  type: string
  material: string
  qty: number
  unit: string
  reference: string
}

export type FabricKpisDto = { items: KpiDto[] }
