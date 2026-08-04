/**
 * Inspection / Accept / Reject / Rework / Hold — wraps existing
 * qualityGateEvaluations stream via evaluateQualityGate.
 * Does not modify Shop Floor or Production Order aggregates.
 */
import { getExecutionContext } from '@/domain/execution-platform/execution-platform-service'
import { getGateForOperation, evaluateQualityGate } from '@/domain/execution-platform/quality-gate-service'
import type { QualityGateDisposition, QualityGateType } from '@/domain/execution-platform/execution-types'

import type { InspectionInput, InspectionResult } from './quality.types'

export class QualityDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QualityDomainError'
  }
}

function requireContext(productionOrderNo: string) {
  const ctx = getExecutionContext(productionOrderNo)
  if (!ctx) throw new QualityDomainError(`Execution context bulunamadı: ${productionOrderNo}`)
  return ctx
}

function resolveGateType(operationCode: string, gateType?: QualityGateType): QualityGateType {
  if (gateType) return gateType
  const fromRoute = getGateForOperation(operationCode)
  if (!fromRoute) throw new QualityDomainError(`${operationCode} için QC planında gate tanımlı değil.`)
  return fromRoute
}

function ncrIdFor(evaluationId: string, disposition: QualityGateDisposition): string | null {
  if (disposition === 'Reject' || disposition === 'Hold' || disposition === 'Scrap') {
    return `NCR-${evaluationId}`
  }
  return null
}

export function persistInspection(input: InspectionInput, actor: string): InspectionResult {
  const ctx = requireContext(input.productionOrderNo)
  const gateType = resolveGateType(input.operationCode, input.gateType)
  const evaluation = evaluateQualityGate({
    executionContextId: ctx.id,
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
    gateType,
    bundleId: input.bundleId ?? null,
    evaluatedBy: actor,
    forceDisposition: input.disposition,
    salesOrderId: ctx.salesOrderId,
    salesOrderNo: ctx.salesOrderNo,
  })

  return {
    evaluationId: evaluation.id,
    productionOrderNo: evaluation.productionOrderNo,
    operationCode: evaluation.operationCode,
    gateType: evaluation.gateType,
    disposition: evaluation.disposition,
    ncrId: ncrIdFor(evaluation.id, evaluation.disposition),
  }
}

export function executeAcceptInspection(
  input: Omit<InspectionInput, 'disposition'> & { disposition?: never },
  actor: string,
): InspectionResult {
  return persistInspection({ ...input, disposition: 'Pass' }, actor)
}

export function executeRejectInspection(
  input: Omit<InspectionInput, 'disposition'>,
  actor: string,
): InspectionResult {
  return persistInspection({ ...input, disposition: 'Reject' }, actor)
}

export function executeReworkInspection(
  input: Omit<InspectionInput, 'disposition'>,
  actor: string,
): InspectionResult {
  return persistInspection({ ...input, disposition: 'Rework' }, actor)
}

export function executeHoldInspection(
  input: Omit<InspectionInput, 'disposition'>,
  actor: string,
): InspectionResult {
  return persistInspection({ ...input, disposition: 'Hold' }, actor)
}
