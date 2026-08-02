import type { KpiDto, StatusBadgeDto } from '../core/types'

export type ProductionOrderListItemDto = {
  id: string
  workOrderNo: string
  orderNo: string
  productCode: string
  plannedQty: number
  producedQty: number
  progress: number
  workshop: string
  status: StatusBadgeDto
}

export type ProductionLineItemDto = {
  id: string
  code: string
  name: string
  workshop: string
  capacity: number
  load: number
}

export type ProductionOperationItemDto = {
  id: string
  sequence: number
  code: string
  name: string
  workshop: string
  progress: number
}

export type ProductionKpisDto = { items: KpiDto[] }
