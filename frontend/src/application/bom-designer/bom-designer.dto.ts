import type { StatusBadgeDto } from '../core/types'
import type { BomLifecycleStatus } from '@/domain/types/textile-erp'

export type BomDesignerLineDto = {
  id: string
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  consumption: number
  wastePercent: number
  actualConsumption: number
  grossRequired: number
  netRequired: number
  warehouseCode: string
  alternativeStockCardId?: string
  alternativeMaterialCode?: string
  notes?: string
  requirement: 'Zorunlu' | 'Opsiyonel'
  valid: StatusBadgeDto
}

export type BomRevisionHistoryDto = {
  revisionNo: number
  status: string
  changedAt: string
  changedBy: string
  changeNote: string
  lineCount: number
  entityRevisionId?: string
}

export type BomEntityRevisionDto = {
  id: string
  revisionNo: number
  status: string
  version: string
  reasonOfChange: string
  createdBy: string
  createdAt: string
  lineCount: number
}

export type BomDesignerViewDto = {
  productId: string
  productCode: string
  productName: string
  bomId: string
  revisionNo: number
  lifecycleStatus: BomLifecycleStatus
  productVersion: number
  editable: boolean
  readOnly: boolean
  lineCount: number
  validationErrors: string[]
  isValid: boolean
  lines: BomDesignerLineDto[]
  revisionHistory: BomRevisionHistoryDto[]
  entityRevisions: BomEntityRevisionDto[]
  activeRevisionRecordId?: string
  orderQty: number
}

export type BomLineCommandInput = {
  id?: string
  stockCardId: string
  consumption: number
  wastePercent: number
  alternativeStockCardId?: string
  notes?: string
  requirement?: 'Zorunlu' | 'Opsiyonel'
}

export type BomCommandResult = {
  productCardId: string
  bomId: string
  revisionNo: number
  status: BomLifecycleStatus
  productVersion: number
}

export type CreateBomCommand = {
  productCardId: string
  expectedVersion: number
  lines: BomLineCommandInput[]
  actorUserId: string
}

export type UpdateBomCommand = {
  productCardId: string
  expectedVersion: number
  lines: BomLineCommandInput[]
  actorUserId: string
}

export type BomLifecycleCommand = {
  productCardId: string
  expectedVersion: number
  actorUserId: string
  comment?: string
}

export type CreateBomRevisionCommand = BomLifecycleCommand & {
  reason: string
  lines: BomLineCommandInput[]
}

export type ActivateBomRevisionCommand = BomLifecycleCommand & {
  revisionRecordId?: string
}

export type StockCardOptionDto = {
  id: string
  code: string
  name: string
  category: string
  unit: string
  label: string
}

export function bomLifecycleLabel(status: BomLifecycleStatus): string {
  const labels: Record<BomLifecycleStatus, string> = {
    Draft: 'Taslak',
    'Under Review': 'İncelemede',
    Approved: 'Onaylı',
    Active: 'Aktif',
    Archived: 'Arşiv',
  }
  return labels[status] ?? status
}

export function bomStatusTone(status: BomLifecycleStatus): import('../core/types').StatusTone {
  if (status === 'Active') return 'success'
  if (status === 'Approved') return 'default'
  if (status === 'Under Review') return 'warning'
  return 'muted'
}

export function bomStatusBadge(status: BomLifecycleStatus): StatusBadgeDto {
  return { label: bomLifecycleLabel(status), tone: bomStatusTone(status) }
}
