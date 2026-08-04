import { runCommandInTransaction } from '@/application/core/command-transaction'
import { moveBundleToOperation } from '@/domain/execution-platform/bundle-tracking-service'
import { getExecutionContext } from '@/domain/execution-platform/execution-platform-service'
import {
  completeOperation,
  pauseOperation,
  resumeOperation,
  startOperation,
} from '@/domain/execution-platform/operation-execution-service'
import {
  completeWorkSession,
  pauseWorkSession,
  resumeWorkSession,
  startWorkSession,
} from '@/domain/execution-platform/operation-work-session-service'
import { confirmProductionCompletion } from '@/domain/shop-floor/completion-confirmation.service'
import {
  persistProductionDeclaration,
  ShopFloorDomainError,
} from '@/domain/shop-floor/production-declaration.service'
import type {
  CompletionConfirmationResult,
  ProductionDeclarationInput,
  ProductionDeclarationResult,
} from '@/domain/shop-floor/shop-floor.types'

export { ShopFloorDomainError }

function requireContextId(productionOrderNo: string): string {
  const context = getExecutionContext(productionOrderNo)
  if (!context) throw new ShopFloorDomainError(`Execution context bulunamadı: ${productionOrderNo}`)
  return context.id
}

export type ProductionDeclarationCommand = ProductionDeclarationInput & { actorUserId: string }

/** Alias: executeDeclareProduction */
export function executeDeclareProduction(
  command: ProductionDeclarationCommand,
): ProductionDeclarationResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    return persistProductionDeclaration(input, actorUserId)
  })
}

export const executeProductionDeclaration = executeDeclareProduction

export function executeCompletionConfirmation(command: {
  productionOrderNo: string
  actorUserId: string
}): CompletionConfirmationResult {
  return runCommandInTransaction(() =>
    confirmProductionCompletion(command.productionOrderNo, command.actorUserId),
  )
}

export type StartSessionCommand = {
  productionOrderNo: string
  operationCode: string
  lineId: string
  workshopCode: string
  machineId: string
  operatorId: string
  shiftCode: string
  plannedQty: number
  actorUserId: string
}

export type SessionActionCommand = {
  productionOrderNo: string
  operationCode: string
  sessionId: string
  actorUserId: string
  reasonCode?: string
  completedQty?: number
  downtimeMinutes?: number
}

export type OperationCommand = {
  productionOrderNo: string
  operationCode: string
  actorUserId: string
  lineId?: string
  workshopCode?: string
  machineId?: string
  operatorId?: string
  shiftCode?: string
  plannedQty?: number
}

export function executeStartOperation(command: OperationCommand) {
  return runCommandInTransaction(() =>
    startOperation({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
      lineId: command.lineId,
      workshopCode: command.workshopCode,
      machineId: command.machineId,
      operatorId: command.operatorId,
      shiftCode: command.shiftCode,
      plannedQty: command.plannedQty,
    }),
  )
}

export function executePauseOperation(command: OperationCommand) {
  return runCommandInTransaction(() =>
    pauseOperation({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
      reasonCode: 'OPERATOR_PAUSE',
    }),
  )
}

export function executeResumeOperation(command: OperationCommand) {
  return runCommandInTransaction(() =>
    resumeOperation({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
    }),
  )
}

export function executeCompleteOperation(command: OperationCommand & { completedQty?: number }) {
  return runCommandInTransaction(() =>
    completeOperation({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      completedQty: command.completedQty ?? command.plannedQty ?? 0,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
      lineId: command.lineId,
      machineId: command.machineId,
      operatorId: command.operatorId,
      shiftCode: command.shiftCode,
    }),
  )
}

export function executeMoveBundle(command: {
  bundleId: string
  toOperationCode: string
  workshopCode: string
  lineId?: string | null
  actorUserId: string
}) {
  return runCommandInTransaction(() =>
    moveBundleToOperation({
      bundleId: command.bundleId,
      toOperationCode: command.toOperationCode,
      workshopCode: command.workshopCode,
      lineId: command.lineId,
      actor: command.actorUserId,
    }),
  )
}

export function executeStartWorkSession(command: StartSessionCommand) {
  return runCommandInTransaction(() =>
    startWorkSession({
      executionContextId: requireContextId(command.productionOrderNo),
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      lineId: command.lineId,
      workshopCode: command.workshopCode,
      machineId: command.machineId,
      operatorId: command.operatorId,
      shiftCode: command.shiftCode,
      plannedQty: command.plannedQty,
      actor: command.actorUserId,
    }),
  )
}

export function executePauseWorkSession(command: SessionActionCommand) {
  return runCommandInTransaction(() =>
    pauseWorkSession({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      sessionId: command.sessionId,
      reasonCode: command.reasonCode ?? 'BREAK',
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
    }),
  )
}

export function executeResumeWorkSession(command: SessionActionCommand) {
  return runCommandInTransaction(() =>
    resumeWorkSession({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      sessionId: command.sessionId,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
    }),
  )
}

/** Alias: executeFinishWorkSession */
export function executeFinishWorkSession(command: SessionActionCommand) {
  return runCommandInTransaction(() =>
    completeWorkSession({
      productionOrderNo: command.productionOrderNo,
      operationCode: command.operationCode,
      sessionId: command.sessionId,
      completedQty: command.completedQty ?? 0,
      downtimeMinutes: command.downtimeMinutes ?? 0,
      actor: command.actorUserId,
      executionContextId: requireContextId(command.productionOrderNo),
    }),
  )
}

export const executeCompleteWorkSession = executeFinishWorkSession
