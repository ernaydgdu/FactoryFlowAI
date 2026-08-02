import type { StatusBadgeDto } from '@/application/core/types'
import type { ExecutionRole } from '@/domain/execution-platform/execution-types'

export type OperationExecutionItemDto = {
  id: string
  operationCode: string
  operationName: string
  department: string
  sequence: number
  status: StatusBadgeDto
  plannedQty: number
  completedQty: number
  wasteQty: number
  reworkQty: number
  secondQualityQty: number
  lineId: string | null
  gatePassed: boolean
  startedAt: string | null
  completedAt: string | null
}

export type OperationExecutionViewModel = {
  productionOrderNo: string
  operations: OperationExecutionItemDto[]
  statusSummary: Record<string, number>
  parallelCapability: ParallelExecutionDto | null
}

export type ParallelExecutionDto = {
  activeSessions: number
  lines: string[]
  operators: string[]
  machines: string[]
  shifts: string[]
}

export type OperationActorCommand = {
  actor: string
  role: ExecutionRole
  productionOrderNo: string
  operationCode: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}

export type StartOperationCommand = OperationActorCommand & {
  lineId?: string
  workshopCode?: string
  machineId?: string
  operatorId?: string
  shiftCode?: string
  bundleIds?: string[]
  plannedQty?: number
}

export type PauseOperationCommand = OperationActorCommand & {
  reasonCode: string
}

export type CompleteOperationCommand = OperationActorCommand & {
  completedQty: number
  wasteQty?: number
  reworkQty?: number
  secondQualityQty?: number
  workSessionId?: string
  lineId?: string
  machineId?: string
  operatorId?: string
  shiftCode?: string
}
