import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  persistApprovePurchaseOrder,
  persistArchivePurchaseOrder,
  persistCancelPurchaseOrder,
  persistClosePurchaseOrder,
  persistCreatePurchaseOrder,
  persistCreatePurchaseOrderRevision,
  PurchaseOrderDomainError,
  type CreatePurchaseOrderInput,
} from '@/domain/purchasing/purchase-order-crud.service'
import { queryPurchaseOrderVersion } from '@/domain/purchasing/purchase-order-query.service'
import {
  persistCreatePurchaseRequest,
  PurchaseRequestDomainError,
  type CreatePurchaseRequestInput,
} from '@/domain/purchasing/purchase-request-crud.service'
import {
  persistCreateRfq,
  persistSelectQuotation,
  RfqDomainError,
  type CreateRfqInput,
} from '@/domain/purchasing/rfq-crud.service'
import type { PurchaseOrderLifecycleStatus } from '@/domain/purchasing/purchasing.types'

export { PurchaseOrderDomainError, PurchaseRequestDomainError, RfqDomainError }

export type PurchasingCommandResult = {
  entityId: string
  entityNo: string
  status: string
  version: number
}

export type CreatePurchaseRequestCommand = CreatePurchaseRequestInput & { actorUserId: string }
export type CreateRfqCommand = CreateRfqInput & { actorUserId: string }
export type CreatePurchaseOrderCommand = CreatePurchaseOrderInput & { actorUserId: string }

export type PurchaseOrderLifecycleCommand = {
  purchaseOrderId: string
  expectedVersion: number
  actorUserId: string
  comment?: string
}

export type CreatePurchaseOrderRevisionCommand = PurchaseOrderLifecycleCommand & {
  reason: string
}

export type SelectQuotationCommand = {
  quotationId: string
  actorUserId: string
}

function poResult(id: string, poNo: string, status: PurchaseOrderLifecycleStatus): PurchasingCommandResult {
  return { entityId: id, entityNo: poNo, status, version: queryPurchaseOrderVersion(id) }
}

export function executeCreatePurchaseRequest(command: CreatePurchaseRequestCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const pr = persistCreatePurchaseRequest(input, actorUserId)
    return { entityId: pr.id, entityNo: pr.prNo, status: pr.status, version: 1 }
  })
}

export function executeCreateRFQ(command: CreateRfqCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const rfq = persistCreateRfq(input, actorUserId)
    return { entityId: rfq.id, entityNo: rfq.rfqNo, status: rfq.status, version: 1 }
  })
}

export function executeCreatePurchaseOrder(command: CreatePurchaseOrderCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const po = persistCreatePurchaseOrder(input, actorUserId)
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeApprovePurchaseOrder(command: PurchaseOrderLifecycleCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const po = persistApprovePurchaseOrder(
      command.purchaseOrderId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeClosePurchaseOrder(command: PurchaseOrderLifecycleCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const po = persistClosePurchaseOrder(
      command.purchaseOrderId,
      command.expectedVersion,
      command.actorUserId,
    )
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeCancelPurchaseOrder(command: PurchaseOrderLifecycleCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const po = persistCancelPurchaseOrder(
      command.purchaseOrderId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeArchivePurchaseOrder(command: PurchaseOrderLifecycleCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const po = persistArchivePurchaseOrder(
      command.purchaseOrderId,
      command.expectedVersion,
      command.actorUserId,
    )
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeCreatePurchaseOrderRevision(
  command: CreatePurchaseOrderRevisionCommand,
): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const po = persistCreatePurchaseOrderRevision(
      command.purchaseOrderId,
      command.reason,
      command.expectedVersion,
      command.actorUserId,
    )
    return poResult(po.id, po.poNo, po.status)
  })
}

export function executeSelectQuotation(command: SelectQuotationCommand): PurchasingCommandResult {
  return runCommandInTransaction(() => {
    const q = persistSelectQuotation(command.quotationId, command.actorUserId)
    return { entityId: q.id, entityNo: q.quotationNo, status: q.status, version: 1 }
  })
}
