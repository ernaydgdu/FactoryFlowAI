/**
 * Operation Work Session — shop floor gerçek çalışma birimi
 * OperationExecution yalnızca aggregate rollup.
 */
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedOperationWorkSession } from '../ports/persistence/persistence-aggregates'
import type { OperationExecution, OperationWorkSession, OperationWorkSessionStatus } from './execution-types'
import { emitExecutionEvent } from './execution-timeline-service'
import { logExecutionCreate, logExecutionUpdate } from './execution-audit-service'

function workSessionRepo() {
  return requireUnitOfWork().workSessions
}

function sessionStreamKey(productionOrderNo: string, operationCode: string) {
  return { streamType: 'work_session', streamId: `${productionOrderNo}:${operationCode}` }
}

function stripSessionMeta(row: PersistedOperationWorkSession): OperationWorkSession {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

export function getWorkSessions(
  productionOrderNo: string,
  operationCode?: string,
): OperationWorkSession[] {
  return workSessionRepo()
    .listByProductionOrder(DEFAULT_TENANT_ID, productionOrderNo, operationCode)
    .map(stripSessionMeta)
}

export function getActiveWorkSessions(productionOrderNo: string): OperationWorkSession[] {
  return getWorkSessions(productionOrderNo).filter(
    (s) => s.status === 'InProgress' || s.status === 'Paused',
  )
}

export function startWorkSession(input: {
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  lineId: string
  workshopCode: string
  machineId: string
  operatorId: string
  shiftCode: string
  bundleIds?: string[]
  plannedQty: number
  actor: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationWorkSession {
  const session: OperationWorkSession = {
    id: workSessionRepo().nextSessionId(),
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
    lineId: input.lineId,
    workshopCode: input.workshopCode,
    machineId: input.machineId,
    operatorId: input.operatorId,
    shiftCode: input.shiftCode,
    bundleIds: input.bundleIds ?? [],
    startedAt: new Date().toISOString(),
    endedAt: null,
    status: 'InProgress',
    plannedQty: input.plannedQty,
    completedQty: 0,
    reworkQty: 0,
    rejectQty: 0,
    downtimeMinutes: 0,
  }

  const persisted: PersistedOperationWorkSession = {
    ...session,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'work_session',
    streamId: `${input.productionOrderNo}:${input.operationCode}`,
    sequence: 0,
  }
  workSessionRepo().append(
    DEFAULT_TENANT_ID,
    sessionStreamKey(input.productionOrderNo, input.operationCode),
    [persisted],
  )

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationStarted',
    title: `Work Session başladı — ${input.operationCode}`,
    description: `Hat ${input.lineId}, Makine ${input.machineId}, Vardiya ${input.shiftCode}`,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: {
      workSessionId: session.id,
      operatorId: input.operatorId,
      machineId: input.machineId,
      shiftCode: input.shiftCode,
      lineId: input.lineId,
    },
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'ShiftStarted',
    title: `Vardiya başladı — ${input.shiftCode}`,
    description: `${input.operationCode} / Hat ${input.lineId}`,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: session.id, shiftCode: input.shiftCode },
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'MachineStarted',
    title: `Makine başladı — ${input.machineId}`,
    description: input.operationCode,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: session.id, machineId: input.machineId },
  })

  logExecutionCreate('OperationWorkSession', session.id, {
    actor: input.actor,
    productionOrderNo: input.productionOrderNo,
    executionContextId: input.executionContextId,
    operationCode: input.operationCode,
    lineId: input.lineId,
    machineId: input.machineId,
    shiftCode: input.shiftCode,
  }, { ...session })

  return session
}

function updateSessionRecord(
  input: { productionOrderNo: string; operationCode: string; sessionId: string },
  patch: Partial<OperationWorkSession>,
  auditCtx: Parameters<typeof logExecutionUpdate>[2],
  oldSnapshot: Record<string, unknown>,
  newSnapshot: Record<string, unknown>,
): OperationWorkSession {
  const sessions = getWorkSessions(input.productionOrderNo, input.operationCode)
  const idx = sessions.findIndex((s) => s.id === input.sessionId)
  if (idx < 0) throw new Error('Work session bulunamadı')
  const updated = { ...sessions[idx], ...patch }
  workSessionRepo().updateSession(DEFAULT_TENANT_ID, updated)
  logExecutionUpdate('OperationWorkSession', input.sessionId, auditCtx, oldSnapshot, newSnapshot)
  return updated
}

export function pauseWorkSession(input: {
  productionOrderNo: string
  operationCode: string
  sessionId: string
  reasonCode: string
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationWorkSession {
  const sessions = getWorkSessions(input.productionOrderNo, input.operationCode)
  const old = sessions.find((s) => s.id === input.sessionId)
  if (!old) throw new Error('Work session bulunamadı')

  const updated = updateSessionRecord(
    input,
    { status: 'Paused' },
    {
      actor: input.actor,
      productionOrderNo: input.productionOrderNo,
      executionContextId: input.executionContextId,
      operationCode: input.operationCode,
      lineId: old.lineId,
      machineId: old.machineId,
      shiftCode: old.shiftCode,
    },
    { status: old.status },
    { status: 'Paused', reasonCode: input.reasonCode },
  )

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationPaused',
    title: 'Work Session duraklatıldı',
    description: `Neden: ${input.reasonCode}`,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId, reasonCode: input.reasonCode },
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'MachineStopped',
    title: 'Makine durdu',
    description: input.reasonCode,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId, machineId: old.machineId },
  })

  return updated
}

export function resumeWorkSession(input: {
  productionOrderNo: string
  operationCode: string
  sessionId: string
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationWorkSession {
  const sessions = getWorkSessions(input.productionOrderNo, input.operationCode)
  const old = sessions.find((s) => s.id === input.sessionId)
  if (!old) throw new Error('Work session bulunamadı')

  const updated = updateSessionRecord(input, { status: 'InProgress' }, {
    actor: input.actor,
    productionOrderNo: input.productionOrderNo,
    executionContextId: input.executionContextId,
    operationCode: input.operationCode,
    lineId: old.lineId,
    machineId: old.machineId,
    shiftCode: old.shiftCode,
  }, { status: old.status }, { status: 'InProgress' })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationResumed',
    title: 'Work Session devam ediyor',
    description: input.operationCode,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId },
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'MachineStarted',
    title: 'Makine devam ediyor',
    description: old.machineId,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId, machineId: old.machineId },
  })

  return updated
}

export function completeWorkSession(input: {
  productionOrderNo: string
  operationCode: string
  sessionId: string
  completedQty: number
  reworkQty?: number
  rejectQty?: number
  downtimeMinutes?: number
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationWorkSession {
  const sessions = getWorkSessions(input.productionOrderNo, input.operationCode)
  const old = sessions.find((s) => s.id === input.sessionId)
  if (!old) throw new Error('Work session bulunamadı')

  const updated = updateSessionRecord(
    input,
    {
      status: 'Completed',
      endedAt: new Date().toISOString(),
      completedQty: old.completedQty + input.completedQty,
      reworkQty: old.reworkQty + (input.reworkQty ?? 0),
      rejectQty: old.rejectQty + (input.rejectQty ?? 0),
      downtimeMinutes: old.downtimeMinutes + (input.downtimeMinutes ?? 0),
    },
    {
      actor: input.actor,
      productionOrderNo: input.productionOrderNo,
      executionContextId: input.executionContextId,
      operationCode: input.operationCode,
      lineId: old.lineId,
      machineId: old.machineId,
      shiftCode: old.shiftCode,
    },
    { status: old.status, completedQty: old.completedQty },
    { status: 'Completed', completedQty: old.completedQty + input.completedQty },
  )

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationCompleted',
    title: 'Work Session tamamlandı',
    description: `${input.completedQty} adet — Hat ${old.lineId}`,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId, lineId: old.lineId },
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'ShiftEnded',
    title: `Vardiya bitti — ${old.shiftCode}`,
    description: input.operationCode,
    actor: input.actor,
    operationCode: input.operationCode,
    metadata: { workSessionId: input.sessionId, shiftCode: old.shiftCode },
  })

  return updated
}

export function rollupOperationExecutionFromSessions(
  productionOrderNo: string,
  operationCode: string,
): Partial<OperationExecution> {
  const sessions = getWorkSessions(productionOrderNo, operationCode)
  if (sessions.length === 0) return {}

  const active = sessions.filter((s) => s.status === 'InProgress' || s.status === 'Paused')
  const completed = sessions.filter((s) => s.status === 'Completed')
  const totalCompleted = sessions.reduce((s, ws) => s + ws.completedQty, 0)
  const totalRework = sessions.reduce((s, ws) => s + ws.reworkQty, 0)
  const totalReject = sessions.reduce((s, ws) => s + ws.rejectQty, 0)

  let status: OperationExecution['status'] = 'Pending'
  if (active.some((s) => s.status === 'InProgress')) status = 'InProgress'
  else if (active.some((s) => s.status === 'Paused')) status = 'Paused'
  else if (completed.length === sessions.length && sessions.length > 0) status = 'Completed'
  else if (sessions.some((s) => s.status === 'Scheduled' || s.status === 'InProgress')) status = 'Ready'

  const earliestStart = sessions.map((s) => s.startedAt).sort()[0]

  return {
    status,
    completedQty: totalCompleted,
    reworkQty: totalRework,
    wasteQty: totalReject,
    lineId: active[0]?.lineId ?? sessions[sessions.length - 1]?.lineId ?? null,
    startedAt: earliestStart ?? null,
    completedAt: status === 'Completed' ? new Date().toISOString() : null,
  }
}

export function getWorkSessionStatusSummary(
  productionOrderNo: string,
): Record<OperationWorkSessionStatus, number> {
  const sessions = getWorkSessions(productionOrderNo)
  const summary: Record<OperationWorkSessionStatus, number> = {
    Scheduled: 0,
    InProgress: 0,
    Paused: 0,
    Completed: 0,
    Cancelled: 0,
  }
  for (const s of sessions) summary[s.status] += 1
  return summary
}
