import type { StatusBadgeDto } from '@/application/core/types'

export type QualityKpiDto = { label: string; value: string; hint: string }

export type QcPlanStepDto = {
  operationCode: string
  sequence: number
  gateType: string
}

export type QcCoverageRowDto = {
  productionOrderNo: string
  productCode: string
  coveragePercent: number
  stepsLabel: string
}

export type InspectionRowDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  gateType: string
  disposition: StatusBadgeDto
  rawDisposition: string
  bundleId: string
  evaluatedAt: string
  evaluatedBy: string
  ncrId: string
}

export type ReworkQueueRowDto = {
  evaluationId: string
  productionOrderNo: string
  operationCode: string
  gateType: string
  bundleId: string
  reworkQty: number
  evaluatedAt: string
  evaluatedBy: string
}

export type HoldQueueRowDto = {
  bundleId: string
  bundleNo: string
  productionOrderNo: string
  currentOperationCode: string
  pieceCount: number
  reasonCode: string
}

export type NcrRowDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  gateType: string
  disposition: string
  status: StatusBadgeDto
  openedAt: string
  openedBy: string
}

export type QualityDashboardDto = {
  kpis: QualityKpiDto[]
  planSteps: QcPlanStepDto[]
  coverage: QcCoverageRowDto[]
  recentInspections: InspectionRowDto[]
  ncrs: NcrRowDto[]
}

export type CapaPlanDto = {
  ncrId: string
  proposedActions: string[]
  owner: string | null
  dueDate: string | null
  valid: boolean
  errors: string[]
}

export type NcrDetailDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  gateType: string
  disposition: string
  status: StatusBadgeDto
  openedAt: string
  openedBy: string
  bundleId: string
  evaluationId: string
  notes: string
  capa: CapaPlanDto
  relatedTimeline: { id: string; occurredAt: string; eventType: string; title: string; actor: string }[]
}

export type QualityTimelineRowDto = {
  id: string
  occurredAt: string
  eventType: string
  title: string
  description: string
  actor: string
  productionOrderNo: string
  operationCode: string
  bundleId: string
}
