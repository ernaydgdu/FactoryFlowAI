import type { StatusBadgeDto } from '@/application/core/types'
import type { ExecutionRole, QualityGateDisposition, QualityGateType } from '@/domain/execution-platform/execution-types'

export type QualityGateEvaluationItemDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  bundleId: string | null
  disposition: StatusBadgeDto
  dispositionRaw: QualityGateDisposition
  rejectQty: number
  reworkQty: number
  scrapQty: number
  secondQualityQty: number
  evaluatedAt: string
  evaluatedBy: string
  notes: string | null
}

export type QualityGateViewModel = {
  productionOrderNo: string
  evaluations: QualityGateEvaluationItemDto[]
  canProceed: Record<string, { allowed: boolean; blockedBy: string | null; reason: string | null }>
}

export type EvaluateQualityGateCommand = {
  actor: string
  role: ExecutionRole
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  bundleId?: string | null
  forceDisposition?: QualityGateDisposition
  salesOrderId?: string
  salesOrderNo?: string
}

export type CompleteReworkCommand = {
  actor: string
  role: ExecutionRole
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  bundleId?: string
  salesOrderId?: string
  salesOrderNo?: string
}

export type CanProceedQuery = {
  productionOrderNo: string
  targetOperationCode: string
}
