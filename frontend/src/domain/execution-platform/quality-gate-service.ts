/**
 * Quality Gate Service — Inline / Midline / Final geçiş şartları
 */
import { QUALITY_INSPECTIONS } from '../data/workflows'
import { resolveCreateBundlesContextForProvisioning } from '../catalog/provisioning-catalog.bridge'
import { buildQualityReworkInput, buildReworkProductionOrder } from '../services/quality-rework-service'
import type { SalesOrder } from '../types'
import { ruleQualityRework } from '../services/business-rule-engine'
import { createEmptyLedger } from '../services/stock-ledger'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedQualityGateEvaluation } from '../ports/persistence/persistence-aggregates'
import type {
  OperationExecution,
  QualityGateDisposition,
  QualityGateEvaluation,
  QualityGateResult,
  QualityGateType,
} from './execution-types'
import {
  TEXTILE_EXECUTION_ROUTE,
  getQualityDispositionEffect,
  normalizeQualityDisposition,
} from './execution-types'
import { emitExecutionEvent } from './execution-timeline-service'
import { logExecutionCreate } from './execution-audit-service'
import { holdBundle } from './bundle-tracking-service'

function qualityGateRepo() {
  return requireUnitOfWork().qualityGateEvaluations
}

function gateStreamKey(productionOrderNo: string) {
  return { streamType: 'quality_gate', streamId: productionOrderNo }
}

function stripGateMeta(row: PersistedQualityGateEvaluation): QualityGateEvaluation {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

function dispositionToTimelineEvent(disposition: QualityGateDisposition): 'QualityPassed' | 'QualityRejected' | 'QualityReworked' | 'QualityGateEvaluated' {
  if (disposition === 'Pass' || disposition === 'PassWithCondition' || disposition === 'SecondQuality') {
    return 'QualityPassed'
  }
  if (disposition === 'Rework') return 'QualityReworked'
  if (disposition === 'Reject' || disposition === 'Scrap') return 'QualityRejected'
  return 'QualityGateEvaluated'
}

function applyDispositionSideEffects(
  disposition: QualityGateDisposition,
  input: {
    bundleId?: string | null
    actor: string
    productionOrderNo: string
    operationCode: string
  },
): void {
  const effect = getQualityDispositionEffect(disposition)
  if (!input.bundleId) return

  switch (effect.bundleAction) {
    case 'Hold':
      holdBundle(input.bundleId, `QUALITY-${disposition}`, input.actor)
      break
    case 'ReworkRoute':
      // BR-13 rework route — bundle metadata hook
      break
    case 'Scrap':
      // Bundle scrap handled by quality gate caller if needed
      break
    default:
      break
  }
}

export function getGateForOperation(operationCode: string): QualityGateType | null {
  const route = TEXTILE_EXECUTION_ROUTE.find((r) => r.operationCode === operationCode)
  return route?.gateAfter ?? null
}

export function getLatestGateEvaluation(
  productionOrderNo: string,
  gateType: QualityGateType,
  operationCode: string,
): QualityGateEvaluation | undefined {
  const row = qualityGateRepo().latestByProductionOrderGate(
    DEFAULT_TENANT_ID,
    productionOrderNo,
    gateType,
    operationCode,
  )
  return row ? stripGateMeta(row) : undefined
}

export function evaluateQualityGate(input: {
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  bundleId?: string | null
  evaluatedBy: string
  forceDisposition?: QualityGateDisposition | QualityGateResult
  salesOrderId?: string
  salesOrderNo?: string
}): QualityGateEvaluation {
  const inspection = QUALITY_INSPECTIONS.find(
    (q) =>
      q.orderNo === input.salesOrderNo &&
      q.module === input.gateType &&
      q.status === 'Tamamlandı',
  )

  let disposition: QualityGateDisposition = 'Pending'
  if (input.forceDisposition) {
    disposition = normalizeQualityDisposition(input.forceDisposition)
  } else if (inspection) {
    disposition =
      inspection.aqlResult === 'Pass'
        ? 'Pass'
        : inspection.aqlResult === 'Fail'
          ? 'Reject'
          : 'Pending'
    if (inspection.repairQty > 0 && inspection.aqlResult === 'Fail') {
      disposition = 'Rework'
    }
  } else {
    disposition = 'Pass'
  }

  const effect = getQualityDispositionEffect(disposition)

  const evaluation: QualityGateEvaluation = {
    id: qualityGateRepo().nextGateId(),
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
    gateType: input.gateType,
    bundleId: input.bundleId ?? null,
    disposition,
    result: disposition,
    inspectionId: inspection?.id ?? null,
    inspectionNo: inspection?.inspectionNo ?? null,
    rejectQty: inspection?.rejectQty ?? 0,
    reworkQty: inspection?.repairQty ?? 0,
    scrapQty: disposition === 'Scrap' ? (inspection?.rejectQty ?? 0) : 0,
    secondQualityQty: disposition === 'SecondQuality' ? (inspection?.rejectQty ?? 0) : 0,
    evaluatedAt: new Date().toISOString(),
    evaluatedBy: input.evaluatedBy,
    notes: inspection ? `AQL ${inspection.aqlLevel}: ${inspection.aqlResult}` : null,
  }
  const persisted: PersistedQualityGateEvaluation = {
    ...evaluation,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'quality_gate',
    streamId: input.productionOrderNo,
    sequence: 0,
  }
  qualityGateRepo().append(DEFAULT_TENANT_ID, gateStreamKey(input.productionOrderNo), [persisted])

  if (effect.triggersBR13 && inspection && inspection.repairQty > 0) {
    try {
      const catalog = resolveCreateBundlesContextForProvisioning(
        inspection.orderId,
        inspection.orderNo,
      )
      const order = catalog.salesOrder as SalesOrder
      const reworkOrder = buildReworkProductionOrder(inspection, order)
      const ledger = createEmptyLedger()
      const reworkInput = buildQualityReworkInput(inspection, order, reworkOrder, input.evaluatedBy)
      ruleQualityRework(reworkInput, ledger)
    } catch {
      // Rework context unavailable — gate evaluation still persisted
    }
  }

  applyDispositionSideEffects(disposition, {
    bundleId: input.bundleId,
    actor: input.evaluatedBy,
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
  })

  const timelineEventType = dispositionToTimelineEvent(disposition)
  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: timelineEventType,
    title: `${input.gateType} Quality Gate — ${disposition}`,
    description: `${input.operationCode}${evaluation.notes ? ` — ${evaluation.notes}` : ''}`,
    actor: input.evaluatedBy,
    operationCode: input.operationCode,
    bundleId: input.bundleId ?? undefined,
    metadata: { gateType: input.gateType, disposition, brEffect: effect },
  })

  if (disposition === 'Rework') {
    emitExecutionEvent({
      executionContextId: input.executionContextId,
      productionOrderNo: input.productionOrderNo,
      salesOrderId: input.salesOrderId,
      salesOrderNo: input.salesOrderNo,
      eventType: 'ReworkStarted',
      title: 'Rework başladı',
      description: `${input.operationCode} — ${evaluation.reworkQty} adet`,
      actor: input.evaluatedBy,
      operationCode: input.operationCode,
      bundleId: input.bundleId ?? undefined,
    })
  }

  logExecutionCreate('QualityGateEvaluation', evaluation.id, {
    actor: input.evaluatedBy,
    productionOrderNo: input.productionOrderNo,
    executionContextId: input.executionContextId,
    operationCode: input.operationCode,
    bundleId: input.bundleId ?? undefined,
  }, { disposition, gateType: input.gateType })

  return evaluation
}

export function canProceedToOperation(
  operations: OperationExecution[],
  targetOperationCode: string,
  productionOrderNo: string,
): { allowed: boolean; blockedBy: string | null; reason: string | null } {
  const targetIdx = TEXTILE_EXECUTION_ROUTE.findIndex((r) => r.operationCode === targetOperationCode)
  if (targetIdx <= 0) return { allowed: true, blockedBy: null, reason: null }

  for (let i = 0; i < targetIdx; i++) {
    const routeStep = TEXTILE_EXECUTION_ROUTE[i]
    const opExec = operations.find((o) => o.operationCode === routeStep.operationCode)
    if (!opExec) continue

    if (opExec.status !== 'Completed' && routeStep.operationCode !== 'NUMBER') {
      return {
        allowed: false,
        blockedBy: routeStep.operationCode,
        reason: `${routeStep.operationCode} operasyonu tamamlanmadı`,
      }
    }

    if (routeStep.gateAfter) {
      const gate = getLatestGateEvaluation(productionOrderNo, routeStep.gateAfter, routeStep.operationCode)
      if (gate) {
        const effect = getQualityDispositionEffect(gate.disposition)
        if (!effect.allowsDownstream) {
          return {
            allowed: false,
            blockedBy: routeStep.operationCode,
            reason: `${routeStep.gateAfter} kalite kapısı: ${gate.disposition}`,
          }
        }
      } else {
        const op = operations.find((o) => o.operationCode === routeStep.operationCode)
        if (op && op.status === 'Completed' && !op.gatePassed) {
          return {
            allowed: false,
            blockedBy: routeStep.operationCode,
            reason: `${routeStep.gateAfter} kalite onayı gerekli`,
          }
        }
      }
    }
  }

  return { allowed: true, blockedBy: null, reason: null }
}

export function getGateEvaluations(productionOrderNo: string): QualityGateEvaluation[] {
  return qualityGateRepo().listByProductionOrder(DEFAULT_TENANT_ID, productionOrderNo).map(stripGateMeta)
}

export function applyGateDispositionToOperation(
  operation: OperationExecution,
  gateType: QualityGateType,
  disposition: QualityGateDisposition,
): OperationExecution {
  if (operation.requiredGate !== gateType) return operation
  const effect = getQualityDispositionEffect(disposition)
  return {
    ...operation,
    gatePassed: effect.allowsDownstream,
    status: effect.blocksOperation ? 'Blocked' : operation.status,
  }
}

/** @deprecated applyGateDispositionToOperation kullanın */
export function applyGateResultToOperation(
  operation: OperationExecution,
  gateType: QualityGateType,
  result: QualityGateResult,
): OperationExecution {
  return applyGateDispositionToOperation(operation, gateType, normalizeQualityDisposition(result))
}

export function completeRework(input: {
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  bundleId?: string
  actor: string
  salesOrderId?: string
  salesOrderNo?: string
}): void {
  emitExecutionEvent({
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: input.salesOrderId,
    salesOrderNo: input.salesOrderNo,
    eventType: 'ReworkCompleted',
    title: 'Rework tamamlandı',
    description: input.operationCode,
    actor: input.actor,
    operationCode: input.operationCode,
    bundleId: input.bundleId,
  })
}
