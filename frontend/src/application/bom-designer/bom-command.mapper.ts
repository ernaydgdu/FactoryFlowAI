import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  persistActivateBomRevision,
  persistApproveBom,
  persistArchiveBom,
  persistCreateBom,
  persistCreateBomRevision,
  persistDeleteBomLine,
  persistSubmitBomForReview,
  persistUpdateBom,
  BomDomainError,
  queryBomVersion,
} from '@/domain/bom/bom-crud.service'
import type { BillOfMaterials } from '@/domain/types/textile-erp'

import type {
  ActivateBomRevisionCommand,
  BomCommandResult,
  BomLifecycleCommand,
  CreateBomCommand,
  CreateBomRevisionCommand,
  UpdateBomCommand,
} from './bom-designer.dto'

export { BomDomainError }

function toResult(bom: BillOfMaterials, productCardId: string): BomCommandResult {
  return {
    productCardId,
    bomId: bom.id,
    revisionNo: bom.revisionNo,
    status: bom.status,
    productVersion: queryBomVersion(productCardId),
  }
}

export function executeCreateBom(command: CreateBomCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistCreateBom(
      command.productCardId,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeUpdateBom(command: UpdateBomCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistUpdateBom(
      command.productCardId,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeDeleteBomLine(
  productCardId: string,
  lineId: string,
  expectedVersion: number,
  actorUserId: string,
): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistDeleteBomLine(productCardId, lineId, expectedVersion, actorUserId)
    return toResult(bom, productCardId)
  })
}

export function executeApproveBom(command: BomLifecycleCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistApproveBom(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeCreateBomRevision(command: CreateBomRevisionCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistCreateBomRevision(
      command.productCardId,
      command.reason,
      command.lines,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeActivateBomRevision(command: ActivateBomRevisionCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistActivateBomRevision(
      command.productCardId,
      command.revisionRecordId ?? '',
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeArchiveBom(command: BomLifecycleCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistArchiveBom(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}

export function executeSubmitBomForReview(command: BomLifecycleCommand): BomCommandResult {
  return runCommandInTransaction(() => {
    const bom = persistSubmitBomForReview(
      command.productCardId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(bom, command.productCardId)
  })
}
