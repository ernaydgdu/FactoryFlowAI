import type { KpiDto, StatusBadgeDto, StatusTone } from '../core/types'

export type SalesOrderListItemDto = {
  id: string
  orderNo: string
  customer: string
  brand: string
  productCode: string
  productName: string
  orderQty: number
  exfDate: string
  productionStatus: StatusBadgeDto
  terminRisk: boolean
  progress: number
}

export type SalesOrderKpisDto = { items: KpiDto[] }

export function salesOrderStatusTone(status: string): StatusTone {
  if (status === 'Sevk Edildi' || status === 'Tamamlandı') return 'success'
  if (status === 'Üretimde') return 'default'
  if (status === 'Beklemede') return 'muted'
  return 'warning'
}

export function salesOrderStatusBadge(status: string): StatusBadgeDto {
  return { label: status, tone: salesOrderStatusTone(status) }
}
