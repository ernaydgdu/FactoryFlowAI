import type { OperationWorkSession } from '@/domain/execution-platform/execution-types'
import {
  completeWorkSession,
  getActiveWorkSessions,
  getWorkSessions,
  getWorkSessionStatusSummary,
  pauseWorkSession,
  resumeWorkSession,
  startWorkSession,
} from '@/domain/execution-platform/operation-work-session-service'
import { applyOperationRollup } from '@/domain/execution-platform/operation-execution-service'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import { mapWorkSessionStatusBadge } from '../shared/presentation.mapper'
import type {
  CompleteWorkSessionCommand,
  PauseWorkSessionCommand,
  ResumeWorkSessionCommand,
  StartWorkSessionCommand,
  WorkSessionItemDto,
  WorkSessionViewModel,
} from './work-session.dto'

function mapSession(s: OperationWorkSession): WorkSessionItemDto {
  return {
    id: s.id,
    operationCode: s.operationCode,
    lineId: s.lineId,
    workshopCode: s.workshopCode,
    machineId: s.machineId,
    operatorId: s.operatorId,
    shiftCode: s.shiftCode,
    bundleIds: s.bundleIds,
    status: mapWorkSessionStatusBadge(s.status),
    plannedQty: s.plannedQty,
    completedQty: s.completedQty,
    reworkQty: s.reworkQty,
    rejectQty: s.rejectQty,
    downtimeMinutes: s.downtimeMinutes,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
  }
}

export function queryWorkSessionView(productionOrderNo: string, operationCode?: string): WorkSessionViewModel {
  const sessions = getWorkSessions(productionOrderNo, operationCode)
  const active = getActiveWorkSessions(productionOrderNo)
  return {
    productionOrderNo,
    sessions: sessions.map(mapSession),
    activeSessions: active.map(mapSession),
    statusSummary: getWorkSessionStatusSummary(productionOrderNo),
  }
}

export function queryWorkSessionList(productionOrderNo: string, operationCode?: string): WorkSessionItemDto[] {
  return getWorkSessions(productionOrderNo, operationCode).map(mapSession)
}

export function commandStartWorkSession(input: StartWorkSessionCommand) {
  return runWithExecutionPermission(input, 'Create', 'WorkSession', () => {
    const session = startWorkSession(input)
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return mapSession(session)
  })
}

export function commandPauseWorkSession(input: PauseWorkSessionCommand) {
  return runWithExecutionPermission(input, 'Cancel', 'WorkSession', () => {
    const session = pauseWorkSession(input)
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return mapSession(session)
  })
}

export function commandResumeWorkSession(input: ResumeWorkSessionCommand) {
  return runWithExecutionPermission(input, 'Update', 'WorkSession', () => {
    const session = resumeWorkSession(input)
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return mapSession(session)
  })
}

export function commandCompleteWorkSession(input: CompleteWorkSessionCommand) {
  return runWithExecutionPermission(input, 'Close', 'WorkSession', () => {
    const session = completeWorkSession(input)
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return mapSession(session)
  })
}
