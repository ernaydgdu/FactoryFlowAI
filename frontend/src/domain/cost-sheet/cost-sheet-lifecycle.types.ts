/** Cost Sheet lifecycle — Product Card aggregate child entity */

import type { CostSheetLifecycleStatus } from '../types/textile-erp'

export type CostSheetLifecycleTransition = {
  from: CostSheetLifecycleStatus
  to: CostSheetLifecycleStatus
  businessRuleId: string
  label: string
}

export const COST_SHEET_LIFECYCLE_TRANSITIONS: CostSheetLifecycleTransition[] = [
  { from: 'Draft', to: 'Under Review', businessRuleId: 'CS-01-SUBMIT', label: 'İncelemeye gönder' },
  { from: 'Under Review', to: 'Approved', businessRuleId: 'CS-02-APPROVE', label: 'Onayla' },
  { from: 'Under Review', to: 'Draft', businessRuleId: 'CS-02-REJECT', label: 'Taslak\'a döndür' },
  { from: 'Approved', to: 'Active', businessRuleId: 'CS-03-ACTIVATE', label: 'Revizyonu aktive et' },
  { from: 'Active', to: 'Archived', businessRuleId: 'CS-04-ARCHIVE', label: 'Arşivle' },
]

export const COST_SHEET_EDITABLE_STATUSES: CostSheetLifecycleStatus[] = ['Draft', 'Under Review']

export function isCostSheetTransitionAllowed(
  from: CostSheetLifecycleStatus,
  to: CostSheetLifecycleStatus,
): boolean {
  return COST_SHEET_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function isCostSheetEditable(status: CostSheetLifecycleStatus): boolean {
  return COST_SHEET_EDITABLE_STATUSES.includes(status)
}

export function isCostSheetReadOnly(status: CostSheetLifecycleStatus): boolean {
  return status === 'Archived'
}
