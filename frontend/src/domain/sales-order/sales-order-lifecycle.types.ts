/** Sales Order lifecycle — aggregate root state machine */

import type { SalesOrderLifecycleStatus } from '../types'

export type SalesOrderLifecycleTransition = {
  from: SalesOrderLifecycleStatus
  to: SalesOrderLifecycleStatus
  businessRuleId: string
  label: string
}

export const SALES_ORDER_LIFECYCLE_TRANSITIONS: SalesOrderLifecycleTransition[] = [
  { from: 'Draft', to: 'Under Review', businessRuleId: 'SO-01-SUBMIT', label: 'İncelemeye gönder' },
  { from: 'Under Review', to: 'Approved', businessRuleId: 'SO-02-APPROVE', label: 'Onayla' },
  { from: 'Under Review', to: 'Draft', businessRuleId: 'SO-02-REJECT', label: 'Taslak\'a döndür' },
  { from: 'Approved', to: 'Active', businessRuleId: 'SO-03-ACTIVATE', label: 'Aktive et' },
  { from: 'Draft', to: 'Cancelled', businessRuleId: 'SO-04-CANCEL', label: 'İptal et' },
  { from: 'Under Review', to: 'Cancelled', businessRuleId: 'SO-04-CANCEL', label: 'İptal et' },
  { from: 'Approved', to: 'Cancelled', businessRuleId: 'SO-04-CANCEL', label: 'İptal et' },
  { from: 'Active', to: 'Closed', businessRuleId: 'SO-05-CLOSE', label: 'Kapat' },
  { from: 'Closed', to: 'Archived', businessRuleId: 'SO-06-ARCHIVE', label: 'Arşivle' },
]

export const SALES_ORDER_EDITABLE_STATUSES: SalesOrderLifecycleStatus[] = ['Draft', 'Under Review']

export function isSalesOrderTransitionAllowed(
  from: SalesOrderLifecycleStatus,
  to: SalesOrderLifecycleStatus,
): boolean {
  return SALES_ORDER_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function isSalesOrderEditable(status: SalesOrderLifecycleStatus): boolean {
  return SALES_ORDER_EDITABLE_STATUSES.includes(status)
}

export function isSalesOrderReadOnly(status: SalesOrderLifecycleStatus): boolean {
  return status === 'Archived' || status === 'Cancelled'
}
