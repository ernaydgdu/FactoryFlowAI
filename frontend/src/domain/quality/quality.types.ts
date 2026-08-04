/**
 * Quality Management — types.
 * QC Result = QualityGateEvaluation (existing stream). NCR/CAPA are
 * derived / plan-only layers — no new persistence aggregate.
 */
import type {
  QualityGateDisposition,
  QualityGateType,
} from '@/domain/execution-platform/execution-types'

export type QcPlanStep = {
  operationCode: string
  sequence: number
  gateType: QualityGateType
  required: true
}

export type InspectionInput = {
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  disposition: QualityGateDisposition
  bundleId?: string | null
  rejectQty?: number
  reworkQty?: number
  scrapQty?: number
  notes?: string | null
}

export type InspectionResult = {
  evaluationId: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  disposition: QualityGateDisposition
  ncrId: string | null
}

export type NcrRecord = {
  id: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  disposition: QualityGateDisposition
  bundleId: string | null
  evaluationId: string
  openedAt: string
  openedBy: string
  status: 'Open' | 'InCapa' | 'Closed'
  notes: string | null
}

export type CapaPlan = {
  ncrId: string
  proposedActions: string[]
  owner: string | null
  dueDate: string | null
  valid: boolean
  errors: string[]
}

export type HoldQueueItem = {
  bundleId: string
  bundleNo: string
  productionOrderNo: string
  currentOperationCode: string | null
  reasonCode: string
  pieceCount: number
}

export type ReworkQueueItem = {
  evaluationId: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  bundleId: string | null
  reworkQty: number
  evaluatedAt: string
  evaluatedBy: string
  status: 'Open' | 'Completed'
}
