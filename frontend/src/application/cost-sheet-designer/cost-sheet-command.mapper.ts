import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  persistActivateCostSheetRevision,
  persistApproveCostSheet,
  persistArchiveCostSheet,
  persistCreateCostSheet,
  persistCreateCostSheetRevision,
  persistRecalculatePlannedCost,
  persistSubmitCostSheetForReview,
  persistUpdateCostSheet,
  CostSheetDomainError,
  queryCostSheetVersion,
} from '@/domain/cost-sheet/cost-sheet-crud.service'
import type { PlannedCostSheet } from '@/domain/types/textile-erp'

import type {
  ActivateCostSheetRevisionCommand,
  CostSheetCommandResult,
  CostSheetLifecycleCommand,
  CreateCostSheetCommand,
  CreateCostSheetRevisionCommand,
  UpdateCostSheetCommand,
} from './cost-sheet-designer.dto'

export { CostSheetDomainError }

function toResult(costSheet: PlannedCostSheet, productCardId: string): CostSheetCommandResult {
  return {
    productCardId,
    costSheetId: costSheet.id,
    revisionNo: costSheet.revisionNo,
    status: costSheet.status,
    productVersion: queryCostSheetVersion(productCardId),
    totalPlannedCost: costSheet.totalPlannedCost,
  }
}

export function executeCreateCostSheet(command: CreateCostSheetCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistCreateCostSheet(
      command.productCardId,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
      command.quantityBasis,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeUpdateCostSheet(command: UpdateCostSheetCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistUpdateCostSheet(
      command.productCardId,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
      command.quantityBasis,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeApproveCostSheet(command: CostSheetLifecycleCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistApproveCostSheet(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeCreateRevision(command: CreateCostSheetRevisionCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistCreateCostSheetRevision(
      command.productCardId,
      command.reason,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeArchiveCostSheet(command: CostSheetLifecycleCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistArchiveCostSheet(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeActivateCostSheetRevision(
  command: ActivateCostSheetRevisionCommand,
): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistActivateCostSheetRevision(
      command.productCardId,
      command.revisionRecordId ?? '',
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeSubmitCostSheetForReview(command: CostSheetLifecycleCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistSubmitCostSheetForReview(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(costSheet, command.productCardId)
  })
}

export function executeRecalculatePlannedCost(command: CostSheetLifecycleCommand): CostSheetCommandResult {
  return runCommandInTransaction(() => {
    const costSheet = persistRecalculatePlannedCost(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(costSheet, command.productCardId)
  })
}
