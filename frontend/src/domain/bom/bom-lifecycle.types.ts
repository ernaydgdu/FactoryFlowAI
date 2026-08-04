/** BOM lifecycle — Product Card aggregate child entity */

import type { BomLifecycleStatus } from '../types/textile-erp'

export type BomLifecycleTransition = {
  from: BomLifecycleStatus
  to: BomLifecycleStatus
  businessRuleId: string
  label: string
}

export const BOM_LIFECYCLE_TRANSITIONS: BomLifecycleTransition[] = [
  { from: 'Draft', to: 'Under Review', businessRuleId: 'BOM-01-SUBMIT', label: 'İncelemeye gönder' },
  { from: 'Under Review', to: 'Approved', businessRuleId: 'BOM-02-APPROVE', label: 'Onayla' },
  { from: 'Under Review', to: 'Draft', businessRuleId: 'BOM-02-REJECT', label: 'Taslak\'a döndür' },
  { from: 'Approved', to: 'Active', businessRuleId: 'BOM-03-ACTIVATE', label: 'Revizyonu aktive et' },
  { from: 'Active', to: 'Archived', businessRuleId: 'BOM-04-ARCHIVE', label: 'Arşivle' },
]

export const BOM_EDITABLE_STATUSES: BomLifecycleStatus[] = ['Draft', 'Under Review']

export function isBomTransitionAllowed(from: BomLifecycleStatus, to: BomLifecycleStatus): boolean {
  return BOM_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function isBomEditable(status: BomLifecycleStatus): boolean {
  return BOM_EDITABLE_STATUSES.includes(status)
}

export function isBomReadOnly(status: BomLifecycleStatus): boolean {
  return status === 'Archived'
}
