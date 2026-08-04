import type { StatusBadgeDto } from '../core/types'
import type {
  PurchaseOrderLifecycleStatus,
  PurchaseRequestStatus,
  RfqStatus,
  SupplierQuotationStatus,
} from '@/domain/purchasing/purchasing.types'

export type PurchaseRequestListItemDto = {
  id: string
  prNo: string
  sourceOrderNo: string
  materialCode: string
  materialName: string
  category: string
  quantity: number
  unit: string
  requiredDate: string
  suggestedSupplier: string
  status: StatusBadgeDto
}

export type PurchaseOrderListItemDto = {
  id: string
  poNo: string
  sourceOrderNo: string
  supplier: string
  supplierCode: string
  termin: string
  deliveryWarehouse: string
  totalAmount: number
  currency: string
  status: StatusBadgeDto
  lifecycleStatus: PurchaseOrderLifecycleStatus
  revisionNo: number
  version: number
}

export type PurchaseOrderDetailDto = PurchaseOrderListItemDto & {
  lines: {
    id: string
    materialCode: string
    materialName: string
    quantity: number
    unit: string
    unitPrice: number
    vatRate: number
    lot?: string
    deliveredQty: number
    remainingQty: number
  }[]
  revisionHistory: { revisionNo: number; status: string; changedAt: string; changeNote: string }[]
  purchaseRequestId: string
  rfqId?: string
  quotationId?: string
}

export type RfqListItemDto = {
  id: string
  rfqNo: string
  purchaseRequestCount: number
  supplierCount: number
  dueDate: string
  status: StatusBadgeDto
}

export type QuotationCompareDto = {
  rfqId: string
  rfqNo: string
  purchaseRequestIds: string[]
  quotations: {
    id: string
    quotationNo: string
    supplierCode: string
    supplierName: string
    totalAmount: number
    currency: string
    status: StatusBadgeDto
    lines: { materialCode: string; unitPrice: number; leadTimeDays: number }[]
  }[]
}

export type PurchasingKpisDto = {
  totalPr: number
  openPr: number
  totalPo: number
  openPo: number
  delayedPo: number
  totalRfq: number
  goodsReceiptCount: number
}

export function purchaseRequestStatusBadge(status: PurchaseRequestStatus): StatusBadgeDto {
  if (status === 'Submitted') return { label: status, tone: 'warning' }
  if (status === 'PO Created') return { label: status, tone: 'success' }
  if (status === 'Cancelled') return { label: status, tone: 'muted' }
  return { label: status, tone: 'default' }
}

export function purchaseOrderLifecycleBadge(status: PurchaseOrderLifecycleStatus): StatusBadgeDto {
  if (status === 'Open' || status === 'Approved') return { label: status, tone: 'default' }
  if (status === 'Partially Received') return { label: status, tone: 'warning' }
  if (status === 'Completed' || status === 'Closed') return { label: status, tone: 'success' }
  if (status === 'Cancelled') return { label: status, tone: 'danger' }
  if (status === 'Archived') return { label: status, tone: 'muted' }
  if (status === 'Under Review') return { label: status, tone: 'warning' }
  return { label: status, tone: 'muted' }
}

export function rfqStatusBadge(status: RfqStatus): StatusBadgeDto {
  if (status === 'Sent') return { label: status, tone: 'warning' }
  if (status === 'Quoted' || status === 'Awarded') return { label: status, tone: 'success' }
  if (status === 'Cancelled') return { label: status, tone: 'muted' }
  return { label: status, tone: 'default' }
}

export function quotationStatusBadge(status: SupplierQuotationStatus): StatusBadgeDto {
  if (status === 'Selected') return { label: status, tone: 'success' }
  if (status === 'Rejected') return { label: status, tone: 'muted' }
  return { label: status, tone: 'warning' }
}
