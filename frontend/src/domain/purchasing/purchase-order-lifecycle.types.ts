import type { PurchaseOrderLifecycleStatus } from './purchasing.types'

export type PurchaseOrderLifecycleTransition = {
  from: PurchaseOrderLifecycleStatus
  to: PurchaseOrderLifecycleStatus
  businessRuleId: string
  label: string
}

export const PURCHASE_ORDER_LIFECYCLE_TRANSITIONS: PurchaseOrderLifecycleTransition[] = [
  { from: 'Draft', to: 'Under Review', businessRuleId: 'PO-01-SUBMIT', label: 'İncelemeye gönder' },
  { from: 'Under Review', to: 'Approved', businessRuleId: 'PO-02-APPROVE', label: 'Onayla' },
  { from: 'Under Review', to: 'Draft', businessRuleId: 'PO-02-REJECT', label: 'Taslak\'a döndür' },
  { from: 'Approved', to: 'Open', businessRuleId: 'PO-03-OPEN', label: 'Aç' },
  { from: 'Open', to: 'Partially Received', businessRuleId: 'PO-04-RECEIVE', label: 'Kısmi teslim' },
  { from: 'Partially Received', to: 'Completed', businessRuleId: 'PO-05-COMPLETE', label: 'Tamamla' },
  { from: 'Open', to: 'Completed', businessRuleId: 'PO-05-COMPLETE', label: 'Tamamla' },
  { from: 'Completed', to: 'Closed', businessRuleId: 'PO-06-CLOSE', label: 'Kapat' },
  { from: 'Closed', to: 'Archived', businessRuleId: 'PO-07-ARCHIVE', label: 'Arşivle' },
  { from: 'Draft', to: 'Cancelled', businessRuleId: 'PO-08-CANCEL', label: 'İptal' },
  { from: 'Under Review', to: 'Cancelled', businessRuleId: 'PO-08-CANCEL', label: 'İptal' },
  { from: 'Approved', to: 'Cancelled', businessRuleId: 'PO-08-CANCEL', label: 'İptal' },
  { from: 'Open', to: 'Cancelled', businessRuleId: 'PO-08-CANCEL', label: 'İptal' },
]

export const PURCHASE_ORDER_EDITABLE_STATUSES: PurchaseOrderLifecycleStatus[] = ['Draft', 'Under Review']

export function isPurchaseOrderTransitionAllowed(
  from: PurchaseOrderLifecycleStatus,
  to: PurchaseOrderLifecycleStatus,
): boolean {
  return PURCHASE_ORDER_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function isPurchaseOrderEditable(status: PurchaseOrderLifecycleStatus): boolean {
  return PURCHASE_ORDER_EDITABLE_STATUSES.includes(status)
}

export function isPurchaseOrderReadOnly(status: PurchaseOrderLifecycleStatus): boolean {
  return status === 'Archived' || status === 'Cancelled'
}
