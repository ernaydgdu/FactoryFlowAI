import type { StatusBadgeDto } from '@/application/core/types'

export type WarehouseSummaryItemDto = {
  id: string
  code: string
  name: string
  type: string
  location: string
  status: StatusBadgeDto
  itemCount: number
  totalOnHand: number
  totalReserved: number
  totalAvailable: number
  lastMovementAt: string | null
}

export type WarehouseDetailDto = {
  id: string
  code: string
  name: string
  type: string
  location: string
  status: StatusBadgeDto
  itemCount: number
  totalOnHand: number
  totalReserved: number
  totalAvailable: number
  lastMovementAt: string | null
  recentMovements: {
    id: string
    date: string
    movementNo: string
    type: string
    material: string
    qty: number
    unit: string
    referenceNo: string
  }[]
}

export type FinishedGoodsWarehouseOptionDto = {
  code: string
  name: string
}
