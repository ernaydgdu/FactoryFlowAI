import type { KpiDto, StatusBadgeDto, StatusTone } from '../core/types'
import type { SalesOrderLifecycleStatus } from '@/domain/types'

export type SalesOrderListItemDto = {
  id: string
  orderNo: string
  customer: string
  brand: string
  productCode: string
  productName: string
  orderQty: number
  exfDate: string
  lifecycleStatus: StatusBadgeDto
  productionStatus: StatusBadgeDto
  terminRisk: boolean
  progress: number
}

export type SalesOrderDetailDto = {
  id: string
  orderNo: string
  version: number
  lifecycleStatus: SalesOrderLifecycleStatus
  editable: boolean
  readOnly: boolean
  general: {
    customer: string
    brand: string
    buyer: string
    merchandiser: string
    season: string
    collection: string
    poNo: string
    orderDate: string
    exf: string
    deliveryTerm: string
    paymentTerm: string
    currency: string
    notes: string
  }
  productCardId: string
  productCode: string
  productName: string
  sizeSetId: string
  unitPrice: number
  lineDeliveryDate?: string
  matrixTotals: { grandTotal: number }
  mrpLineCount: number
  revisionNo: number
}

export type SalesOrderKpisDto = { items: KpiDto[] }

export function salesOrderLifecycleLabel(status: SalesOrderLifecycleStatus): string {
  const labels: Record<SalesOrderLifecycleStatus, string> = {
    Draft: 'Taslak',
    'Under Review': 'İncelemede',
    Approved: 'Onaylı',
    Active: 'Aktif',
    Cancelled: 'İptal',
    Closed: 'Kapalı',
    Archived: 'Arşiv',
  }
  return labels[status] ?? status
}

export function salesOrderLifecycleTone(status: SalesOrderLifecycleStatus): StatusTone {
  if (status === 'Active') return 'success'
  if (status === 'Approved') return 'default'
  if (status === 'Under Review') return 'warning'
  if (status === 'Cancelled') return 'danger'
  return 'muted'
}

export function salesOrderLifecycleBadge(status: SalesOrderLifecycleStatus): StatusBadgeDto {
  return { label: salesOrderLifecycleLabel(status), tone: salesOrderLifecycleTone(status) }
}

export function salesOrderStatusTone(status: string): StatusTone {
  if (status === 'Sevk Edildi' || status === 'Tamamlandı') return 'success'
  if (status === 'Üretimde') return 'default'
  if (status === 'Beklemede') return 'muted'
  return 'warning'
}

export function salesOrderStatusBadge(status: string): StatusBadgeDto {
  return { label: status, tone: salesOrderStatusTone(status) }
}
