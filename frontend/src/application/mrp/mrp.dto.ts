import type { KpiDto, StatusBadgeDto } from '../core/types'

export type MrpLineItemDto = {
  id: string
  orderId: string
  orderNo: string
  materialName: string
  category: string
  orderQty: number
  netRequired: number
  unit: string
  supplier: string
  leadTimeDays: number
  status: StatusBadgeDto
}

export type MrpKpisDto = { items: KpiDto[] }
