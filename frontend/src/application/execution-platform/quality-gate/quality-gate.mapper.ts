import type { QualityGateEvaluation } from '@/domain/execution-platform/execution-types'
import { getOperationExecutions } from '@/domain/execution-platform/operation-execution-service'
import {
  canProceedToOperation,
  completeRework,
  evaluateQualityGate,
  getGateEvaluations,
  getGateForOperation,
  getLatestGateEvaluation,
} from '@/domain/execution-platform/quality-gate-service'
import { TEXTILE_EXECUTION_ROUTE } from '@/domain/execution-platform/execution-types'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import { mapQualityDispositionBadge } from '../shared/presentation.mapper'
import type {
  CanProceedQuery,
  CompleteReworkCommand,
  EvaluateQualityGateCommand,
  QualityGateEvaluationItemDto,
  QualityGateViewModel,
} from './quality-gate.dto'

function mapEvaluation(g: QualityGateEvaluation): QualityGateEvaluationItemDto {
  return {
    id: g.id,
    productionOrderNo: g.productionOrderNo,
    operationCode: g.operationCode,
    gateType: g.gateType,
    bundleId: g.bundleId,
    disposition: mapQualityDispositionBadge(g.disposition),
    dispositionRaw: g.disposition,
    rejectQty: g.rejectQty,
    reworkQty: g.reworkQty,
    scrapQty: g.scrapQty,
    secondQualityQty: g.secondQualityQty,
    evaluatedAt: g.evaluatedAt,
    evaluatedBy: g.evaluatedBy,
    notes: g.notes,
  }
}

export function queryQualityGateView(productionOrderNo: string): QualityGateViewModel {
  const ops = getOperationExecutions(productionOrderNo)
  const canProceed: QualityGateViewModel['canProceed'] = {}
  for (const step of TEXTILE_EXECUTION_ROUTE) {
    canProceed[step.operationCode] = canProceedToOperation(ops, step.operationCode, productionOrderNo)
  }
  return {
    productionOrderNo,
    evaluations: getGateEvaluations(productionOrderNo).map(mapEvaluation),
    canProceed,
  }
}

export function queryGateEvaluations(productionOrderNo: string): QualityGateEvaluationItemDto[] {
  return getGateEvaluations(productionOrderNo).map(mapEvaluation)
}

export function queryLatestGateEvaluation(
  productionOrderNo: string,
  gateType: import('@/domain/execution-platform/execution-types').QualityGateType,
  operationCode: string,
): QualityGateEvaluationItemDto | null {
  const g = getLatestGateEvaluation(productionOrderNo, gateType, operationCode)
  return g ? mapEvaluation(g) : null
}

export function queryGateForOperation(operationCode: string) {
  return getGateForOperation(operationCode)
}

export function queryCanProceed(input: CanProceedQuery) {
  const ops = getOperationExecutions(input.productionOrderNo)
  return canProceedToOperation(ops, input.targetOperationCode, input.productionOrderNo)
}

export function commandEvaluateQualityGate(input: EvaluateQualityGateCommand) {
  return runWithExecutionPermission(input, 'Create', 'QualityGate', () =>
    mapEvaluation(evaluateQualityGate({ ...input, evaluatedBy: input.actor })),
  )
}

export function commandCompleteRework(input: CompleteReworkCommand) {
  return runWithExecutionPermission(input, 'Approve', 'QualityGate', () => {
    completeRework(input)
    return queryQualityGateView(input.productionOrderNo)
  })
}
