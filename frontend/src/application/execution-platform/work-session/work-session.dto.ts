import type { StatusBadgeDto } from '@/application/core/types'
import type { ExecutionRole } from '@/domain/execution-platform/execution-types'

export type WorkSessionItemDto = {
  id: string
  operationCode: string
  lineId: string
  workshopCode: string
  machineId: string
  operatorId: string
  shiftCode: string
  bundleIds: string[]
  status: StatusBadgeDto
  plannedQty: number
  completedQty: number
  reworkQty: number
  rejectQty: number
  downtimeMinutes: number
  startedAt: string
  endedAt: string | null
}

export type WorkSessionViewModel = {
  productionOrderNo: string
  sessions: WorkSessionItemDto[]
  activeSessions: WorkSessionItemDto[]
  statusSummary: Record<string, number>
}

export type WorkSessionActorCommand = {
  actor: string
  role: ExecutionRole
  productionOrderNo: string
  operationCode: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}

export type StartWorkSessionCommand = WorkSessionActorCommand & {
  lineId: string
  workshopCode: string
  machineId: string
  operatorId: string
  shiftCode: string
  bundleIds?: string[]
  plannedQty: number
}

export type PauseWorkSessionCommand = WorkSessionActorCommand & {
  sessionId: string
  reasonCode: string
}

export type CompleteWorkSessionCommand = WorkSessionActorCommand & {
  sessionId: string
  completedQty: number
  reworkQty?: number
  rejectQty?: number
  downtimeMinutes?: number
}

export type ResumeWorkSessionCommand = WorkSessionActorCommand & {
  sessionId: string
}
