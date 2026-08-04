/** MRP Run lifecycle — aggregate root state machine */

import type { MrpRunStatus } from './mrp.types'

export type MrpLifecycleTransition = {
  from: MrpRunStatus
  to: MrpRunStatus
  businessRuleId: string
  label: string
}

export const MRP_LIFECYCLE_TRANSITIONS: MrpLifecycleTransition[] = [
  { from: 'Draft', to: 'Calculated', businessRuleId: 'MRP-01-RUN', label: 'Hesapla' },
  { from: 'Calculated', to: 'Approved', businessRuleId: 'MRP-02-APPROVE', label: 'Onayla' },
  { from: 'Approved', to: 'Released', businessRuleId: 'MRP-03-RELEASE', label: 'Serbest bırak' },
  { from: 'Calculated', to: 'Draft', businessRuleId: 'MRP-04-RECALC', label: 'Yeniden hesapla' },
  { from: 'Approved', to: 'Calculated', businessRuleId: 'MRP-04-RECALC', label: 'Yeniden hesapla' },
  { from: 'Released', to: 'Archived', businessRuleId: 'MRP-05-ARCHIVE', label: 'Arşivle' },
]

export function isMrpTransitionAllowed(from: MrpRunStatus, to: MrpRunStatus): boolean {
  return MRP_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function isMrpEditable(status: MrpRunStatus): boolean {
  return status === 'Draft' || status === 'Calculated'
}

export function isMrpReadOnly(status: MrpRunStatus): boolean {
  return status === 'Archived'
}
