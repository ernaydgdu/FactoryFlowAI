import { runCommandInTransaction } from '@/application/core/command-transaction'
import { getExecutionContext } from '@/domain/execution-platform/execution-platform-service'
import { completeRework } from '@/domain/execution-platform/quality-gate-service'
import type { QualityGateType } from '@/domain/execution-platform/execution-types'
import {
  executeAcceptInspection,
  executeHoldInspection,
  executeRejectInspection,
  executeReworkInspection,
  persistInspection,
  QualityDomainError,
} from '@/domain/quality/inspection.service'
import type { InspectionInput, InspectionResult } from '@/domain/quality/quality.types'

export { QualityDomainError }

export type InspectionCommand = Omit<InspectionInput, 'disposition'> & {
  actorUserId: string
  disposition?: InspectionInput['disposition']
}

function toBase(command: InspectionCommand): Omit<InspectionInput, 'disposition'> {
  const { actorUserId: _a, disposition: _d, ...rest } = command
  return rest
}

/** executeInspection — genel muayene (disposition zorunlu) */
export function executeInspection(command: InspectionCommand & { disposition: InspectionInput['disposition'] }): InspectionResult {
  return runCommandInTransaction(() =>
    persistInspection({ ...toBase(command), disposition: command.disposition }, command.actorUserId),
  )
}

export function executeAccept(command: InspectionCommand): InspectionResult {
  return runCommandInTransaction(() => executeAcceptInspection(toBase(command), command.actorUserId))
}

export function executeReject(command: InspectionCommand): InspectionResult {
  return runCommandInTransaction(() => executeRejectInspection(toBase(command), command.actorUserId))
}

export function executeRework(command: InspectionCommand): InspectionResult {
  return runCommandInTransaction(() => executeReworkInspection(toBase(command), command.actorUserId))
}

export function executeHold(command: InspectionCommand): InspectionResult {
  return runCommandInTransaction(() => executeHoldInspection(toBase(command), command.actorUserId))
}

export function executeCompleteRework(command: {
  productionOrderNo: string
  operationCode: string
  bundleId?: string
  actorUserId: string
}) {
  return runCommandInTransaction(() => {
    const ctx = getExecutionContext(command.productionOrderNo)
    if (!ctx) throw new QualityDomainError(`Execution context bulunamadı: ${command.productionOrderNo}`)
    completeRework({
      executionContextId: ctx.id,
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      bundleId: command.bundleId,
      actor: command.actorUserId,
      salesOrderId: ctx.salesOrderId,
      salesOrderNo: ctx.salesOrderNo,
    })
    return { ok: true as const }
  })
}

export type GateOption = { operationCode: string; gateType: QualityGateType }
