/**
 * Operation Execution Service — aggregate rollup (shop floor = WorkSession)
 */
import { operationRepository, productionLineRepository, workshopRepository } from '../master-data'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedExecutionContext } from '../ports/persistence/persistence-aggregates'
import type { OperationExecution, OperationExecutionStatus } from './execution-types'
import { TEXTILE_EXECUTION_ROUTE } from './execution-types'
import {
  canProceedToOperation,
  evaluateQualityGate,
  getGateForOperation,
} from './quality-gate-service'
import { emitExecutionEvent } from './execution-timeline-service'
import { logExecutionUpdate } from './execution-audit-service'
import {
  completeWorkSession,
  getWorkSessions,
  rollupOperationExecutionFromSessions,
  startWorkSession,
} from './operation-work-session-service'

function ctxRepo() {
  return requireUnitOfWork().executionContexts
}

function loadContext(productionOrderNo: string): PersistedExecutionContext {
  const ctx = ctxRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo)
  if (!ctx) throw new Error('Operasyon kaydı bulunamadı')
  return ctx
}

function loadOps(productionOrderNo: string): OperationExecution[] {
  return loadContext(productionOrderNo).operationExecutions
}

function persistOps(productionOrderNo: string, operations: OperationExecution[]): void {
  const ctx = loadContext(productionOrderNo)
  ctxRepo().save(DEFAULT_TENANT_ID, { ...ctx, operationExecutions: operations })
}

export function createOperationExecutions(input: {
  executionContextId: string
  productionOrderNo: string
  workshopCode: string
  lineId: string | null
  plannedQty: number
}): OperationExecution[] {
  const existing = loadOps(input.productionOrderNo)
  if (existing.length > 0) return existing

  const operations: OperationExecution[] = TEXTILE_EXECUTION_ROUTE.map((step) => {
    const master = operationRepository.getByCode(step.operationCode)
    return {
      id: ctxRepo().nextOperationId(),
      executionContextId: input.executionContextId,
      productionOrderNo: input.productionOrderNo,
      operationCode: step.operationCode,
      operationName: master?.name ?? step.operationCode,
      department: master?.department ?? '—',
      sequence: step.sequence,
      status: step.operationCode === 'CUT' ? 'Ready' : 'Pending',
      workshopCode: input.workshopCode,
      lineId: input.lineId,
      plannedQty: input.plannedQty,
      completedQty: 0,
      wasteQty: 0,
      reworkQty: 0,
      secondQualityQty: 0,
      waitingQty: 0,
      requiredGate: step.gateAfter,
      gatePassed: step.gateAfter === null,
      standardMinutes: master?.standardMinutes ?? 0,
      actualMinutes: 0,
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      pauseReasonCode: null,
    }
  })

  persistOps(input.productionOrderNo, operations)
  return operations
}

export function getOperationExecutions(productionOrderNo: string): OperationExecution[] {
  return loadOps(productionOrderNo)
}

export function applyOperationRollup(productionOrderNo: string, operationCode: string): OperationExecution | null {
  const rollup = rollupOperationExecutionFromSessions(productionOrderNo, operationCode)
  if (Object.keys(rollup).length === 0) return null
  return updateOperation(productionOrderNo, operationCode, rollup)
}

function updateOperation(productionOrderNo: string, operationCode: string, patch: Partial<OperationExecution>): OperationExecution {
  const ops = loadOps(productionOrderNo)
  const idx = ops.findIndex((o) => o.operationCode === operationCode)
  if (idx < 0) throw new Error(`Operasyon bulunamadı: ${operationCode}`)
  ops[idx] = { ...ops[idx], ...patch }
  persistOps(productionOrderNo, ops)
  return ops[idx]
}

export function startOperation(input: {
  productionOrderNo: string
  operationCode: string
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
  lineId?: string
  workshopCode?: string
  machineId?: string
  operatorId?: string
  shiftCode?: string
  bundleIds?: string[]
  plannedQty?: number
}): OperationExecution {
  const ops = getOperationExecutions(input.productionOrderNo)
  const check = canProceedToOperation(ops, input.operationCode, input.productionOrderNo)
  if (!check.allowed) throw new Error(check.reason ?? 'Operasyona geçilemez')

  const op = ops.find((o) => o.operationCode === input.operationCode)
  if (!op) throw new Error('Operasyon bulunamadı')
  if (op.status === 'Completed') throw new Error('Operasyon zaten tamamlandı')
  if (op.status === 'Blocked') throw new Error('Operasyon kalite nedeniyle bloklu')

  if (input.lineId && input.machineId && input.operatorId && input.shiftCode) {
    startWorkSession({
      executionContextId: input.executionContextId,
      productionOrderNo: input.productionOrderNo,
      operationCode: input.operationCode,
      lineId: input.lineId,
      workshopCode: input.workshopCode ?? op.workshopCode,
      machineId: input.machineId,
      operatorId: input.operatorId,
      shiftCode: input.shiftCode,
      bundleIds: input.bundleIds,
      plannedQty: input.plannedQty ?? op.plannedQty,
      actor: input.actor,
      salesOrderId: input.salesOrderId,
      salesOrderNo: input.salesOrderNo,
    })
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return getOperationExecutions(input.productionOrderNo).find((o) => o.operationCode === input.operationCode)!
  }

  const updated = updateOperation(input.productionOrderNo, input.operationCode, {
    status: 'InProgress',
    startedAt: new Date().toISOString(),
    lineId: input.lineId ?? op.lineId,
    pausedAt: null,
    pauseReasonCode: null,
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationStarted',
    title: `${updated.operationName} başladı`,
    description: `${input.operationCode} — Hat: ${updated.lineId ?? '—'}`,
    actor: input.actor,
    operationCode: input.operationCode,
  })

  return updated
}

export function pauseOperation(input: {
  productionOrderNo: string
  operationCode: string
  reasonCode: string
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationExecution {
  const updated = updateOperation(input.productionOrderNo, input.operationCode, {
    status: 'Paused',
    pausedAt: new Date().toISOString(),
    pauseReasonCode: input.reasonCode,
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationPaused',
    title: `${updated.operationName} duraklatıldı`,
    description: `Neden: ${input.reasonCode}`,
    actor: input.actor,
    operationCode: input.operationCode,
  })

  return updated
}

export function resumeOperation(input: {
  productionOrderNo: string
  operationCode: string
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
}): OperationExecution {
  const updated = updateOperation(input.productionOrderNo, input.operationCode, {
    status: 'InProgress',
    pausedAt: null,
    pauseReasonCode: null,
  })

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationResumed',
    title: `${updated.operationName} devam ediyor`,
    description: input.operationCode,
    actor: input.actor,
    operationCode: input.operationCode,
  })

  return updated
}

export function completeOperation(input: {
  productionOrderNo: string
  operationCode: string
  completedQty: number
  wasteQty?: number
  reworkQty?: number
  secondQualityQty?: number
  actor: string
  executionContextId: string
  salesOrderId?: string
  salesOrderNo?: string
  workSessionId?: string
  lineId?: string
  machineId?: string
  operatorId?: string
  shiftCode?: string
}): OperationExecution {
  const op = getOperationExecutions(input.productionOrderNo).find((o) => o.operationCode === input.operationCode)
  if (!op) throw new Error('Operasyon bulunamadı')

  const sessions = getWorkSessions(input.productionOrderNo, input.operationCode)
  if (sessions.length > 0 && input.workSessionId) {
    completeWorkSession({
      productionOrderNo: input.productionOrderNo,
      operationCode: input.operationCode,
      sessionId: input.workSessionId,
      completedQty: input.completedQty,
      reworkQty: input.reworkQty,
      rejectQty: input.wasteQty,
      actor: input.actor,
      executionContextId: input.executionContextId,
      salesOrderId: input.salesOrderId,
      salesOrderNo: input.salesOrderNo,
    })
    applyOperationRollup(input.productionOrderNo, input.operationCode)
    return getOperationExecutions(input.productionOrderNo).find((o) => o.operationCode === input.operationCode)!
  }

  if (op.status !== 'InProgress' && op.status !== 'Paused' && sessions.length === 0) {
    throw new Error('Yalnızca InProgress/Paused operasyon tamamlanabilir')
  }

  let gatePassed = op.gatePassed
  const gateType = getGateForOperation(input.operationCode)
  if (gateType) {
    const evaluation = evaluateQualityGate({
      executionContextId: input.executionContextId,
      productionOrderNo: input.productionOrderNo,
      operationCode: input.operationCode,
      gateType,
      evaluatedBy: input.actor,
      salesOrderId: input.salesOrderId,
      salesOrderNo: input.salesOrderNo,
    })
    gatePassed = evaluation.disposition === 'Pass' || evaluation.disposition === 'PassWithCondition' || evaluation.disposition === 'SecondQuality'
    const blocks = ['Reject', 'Scrap', 'Rework', 'Hold', 'Pending'].includes(evaluation.disposition)
    if (blocks) {
      updateOperation(input.productionOrderNo, input.operationCode, { status: 'Blocked', gatePassed: false })
      throw new Error(`${gateType} kalite kapısı: ${evaluation.disposition}`)
    }
  }

  const updated = updateOperation(input.productionOrderNo, input.operationCode, {
    status: 'Completed',
    completedQty: op.completedQty + input.completedQty,
    wasteQty: op.wasteQty + (input.wasteQty ?? 0),
    reworkQty: op.reworkQty + (input.reworkQty ?? 0),
    secondQualityQty: op.secondQualityQty + (input.secondQualityQty ?? 0),
    completedAt: new Date().toISOString(),
    gatePassed,
  })

  const routeIdx = TEXTILE_EXECUTION_ROUTE.findIndex((r) => r.operationCode === input.operationCode)
  const nextRoute = TEXTILE_EXECUTION_ROUTE[routeIdx + 1]
  if (nextRoute) {
    const ops = getOperationExecutions(input.productionOrderNo)
    const nextOp = ops.find((o) => o.operationCode === nextRoute.operationCode)
    if (nextOp && nextOp.status === 'Pending') {
      updateOperation(input.productionOrderNo, nextRoute.operationCode, { status: 'Ready' })
    }
  }

  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'OperationCompleted',
    title: `${updated.operationName} tamamlandı`,
    description: `${input.completedQty} adet — fire ${input.wasteQty ?? 0}`,
    actor: input.actor,
    operationCode: input.operationCode,
  })

  logExecutionUpdate('OperationExecution', updated.id, {
    actor: input.actor,
    productionOrderNo: input.productionOrderNo,
    executionContextId: input.executionContextId,
    operationCode: input.operationCode,
    lineId: input.lineId ?? updated.lineId ?? undefined,
    machineId: input.machineId,
    shiftCode: input.shiftCode,
  }, { status: op.status, completedQty: op.completedQty }, {
    status: 'Completed',
    completedQty: updated.completedQty,
  })

  return updated
}

export function getOperationExecutionStatusSummary(productionOrderNo: string): Record<OperationExecutionStatus, number> {
  const ops = getOperationExecutions(productionOrderNo)
  const summary: Record<OperationExecutionStatus, number> = {
    Pending: 0,
    Ready: 0,
    Waiting: 0,
    InProgress: 0,
    Paused: 0,
    Completed: 0,
    Blocked: 0,
  }
  for (const op of ops) summary[op.status] += 1
  return summary
}

export function resolveWorkshopAndLine(workshopCode: string, lineId?: string | null) {
  const workshop = workshopRepository.getByCode(workshopCode)
  const line = lineId ? productionLineRepository.getById(lineId) : productionLineRepository.getActive()[0]
  return { workshop, line }
}

export function getParallelExecutionCapability(productionOrderNo: string, operationCode: string): {
  activeSessions: number
  lines: string[]
  operators: string[]
  machines: string[]
  shifts: string[]
} {
  const sessions = getWorkSessions(productionOrderNo, operationCode).filter(
    (s) => s.status === 'InProgress' || s.status === 'Paused',
  )
  return {
    activeSessions: sessions.length,
    lines: [...new Set(sessions.map((s) => s.lineId))],
    operators: [...new Set(sessions.map((s) => s.operatorId))],
    machines: [...new Set(sessions.map((s) => s.machineId))],
    shifts: [...new Set(sessions.map((s) => s.shiftCode))],
  }
}
