import type { StatusBadgeDto } from '../core/types'
import type { CostSheetLifecycleStatus, CostSheetLineKey } from '@/domain/types/textile-erp'

export type CostSheetLineDto = {
  key: CostSheetLineKey
  label: string
  amount: number
  unitAmount: number
  percent: number
  bomDerived: boolean
  isManualOverride: boolean
  notes?: string
}

export type CostSheetRevisionHistoryDto = {
  revisionNo: number
  status: string
  changedAt: string
  changedBy: string
  changeNote: string
  totalPlannedCost: number
  entityRevisionId?: string
}

export type CostSheetEntityRevisionDto = {
  id: string
  revisionNo: number
  status: string
  version: string
  reasonOfChange: string
  createdBy: string
  createdAt: string
  totalPlannedCost: number
}

export type CostSheetVarianceDto = {
  key: CostSheetLineKey
  label: string
  current: number
  previous: number
  delta: number
  deltaPercent: number
}

export type CostSheetDesignerViewDto = {
  productId: string
  productCode: string
  productName: string
  costSheetId: string
  revisionNo: number
  lifecycleStatus: CostSheetLifecycleStatus
  productVersion: number
  editable: boolean
  readOnly: boolean
  validationErrors: string[]
  isValid: boolean
  lines: CostSheetLineDto[]
  revisionHistory: CostSheetRevisionHistoryDto[]
  entityRevisions: CostSheetEntityRevisionDto[]
  activeRevisionRecordId?: string
  quantityBasis: number
  totalPlannedCost: number
  unitPlannedCost: number
  fob: number
  cm: number
  profitMarginPercent: number
  bomRevisionNo?: number
  variancePreview: CostSheetVarianceDto[]
}

export type CostSheetLineCommandInput = {
  key: CostSheetLineKey
  amount: number
  isManualOverride?: boolean
  notes?: string
}

export type CostSheetCommandResult = {
  productCardId: string
  costSheetId: string
  revisionNo: number
  status: CostSheetLifecycleStatus
  productVersion: number
  totalPlannedCost: number
}

export type CreateCostSheetCommand = {
  productCardId: string
  expectedVersion: number
  lines: CostSheetLineCommandInput[]
  actorUserId: string
  quantityBasis?: number
}

export type UpdateCostSheetCommand = {
  productCardId: string
  expectedVersion: number
  lines: CostSheetLineCommandInput[]
  actorUserId: string
  quantityBasis?: number
}

export type CostSheetLifecycleCommand = {
  productCardId: string
  expectedVersion: number
  actorUserId: string
  comment?: string
}

export type CreateCostSheetRevisionCommand = CostSheetLifecycleCommand & {
  reason: string
  lines: CostSheetLineCommandInput[]
}

export type ActivateCostSheetRevisionCommand = CostSheetLifecycleCommand & {
  revisionRecordId?: string
}

export function costSheetLifecycleLabel(status: CostSheetLifecycleStatus): string {
  const labels: Record<CostSheetLifecycleStatus, string> = {
    Draft: 'Taslak',
    'Under Review': 'İncelemede',
    Approved: 'Onaylı',
    Active: 'Aktif',
    Archived: 'Arşiv',
  }
  return labels[status] ?? status
}

export function costSheetStatusTone(status: CostSheetLifecycleStatus): import('../core/types').StatusTone {
  if (status === 'Active') return 'success'
  if (status === 'Approved') return 'default'
  if (status === 'Under Review') return 'warning'
  return 'muted'
}

export function costSheetStatusBadge(status: CostSheetLifecycleStatus): StatusBadgeDto {
  return { label: costSheetLifecycleLabel(status), tone: costSheetStatusTone(status) }
}
