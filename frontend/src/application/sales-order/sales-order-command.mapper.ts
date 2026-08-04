import { runSalesOrderWriteCommand } from './sales-order-permission.guard'
import {
  persistApproveSalesOrder,
  persistArchiveSalesOrder,
  persistCancelSalesOrder,
  persistCloseSalesOrder,
  persistCreateSalesOrder,
  persistCreateSalesOrderRevision,
  persistUpdateSalesOrder,
  SalesOrderDomainError,
} from '@/domain/sales-order/sales-order-crud.service'
import { querySalesOrderVersion } from '@/domain/sales-order/sales-order-query.service'
import type { SalesOrder } from '@/domain/types'
import type { SalesOrderUpsertInput } from '@/domain/services/sales-order/sales-order-build.service'

export { SalesOrderDomainError }

export type SalesOrderCommandResult = {
  salesOrderId: string
  orderNo: string
  status: SalesOrder['status']
  version: number
}

export type CreateSalesOrderCommand = SalesOrderUpsertInput & {
  actorUserId: string
}

export type UpdateSalesOrderCommand = SalesOrderUpsertInput & {
  salesOrderId: string
  expectedVersion: number
  actorUserId: string
}

export type SalesOrderLifecycleCommand = {
  salesOrderId: string
  expectedVersion: number
  actorUserId: string
  comment?: string
}

export type CreateSalesOrderRevisionCommand = SalesOrderLifecycleCommand & {
  reason: string
  input: SalesOrderUpsertInput
}

function toResult(order: SalesOrder): SalesOrderCommandResult {
  return {
    salesOrderId: order.id,
    orderNo: order.orderNo,
    status: order.status,
    version: querySalesOrderVersion(order.id),
  }
}

export function executeCreateSalesOrder(command: CreateSalesOrderCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const { actorUserId, ...input } = command
    const order = persistCreateSalesOrder(input, actorUserId)
    return toResult(order)
  })
}

export function executeUpdateSalesOrder(command: UpdateSalesOrderCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const { salesOrderId, expectedVersion, actorUserId, ...input } = command
    const order = persistUpdateSalesOrder(salesOrderId, input, expectedVersion, actorUserId)
    return toResult(order)
  })
}

export function executeApproveSalesOrder(command: SalesOrderLifecycleCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const order = persistApproveSalesOrder(
      command.salesOrderId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return toResult(order)
  })
}

export function executeCancelSalesOrder(command: SalesOrderLifecycleCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const order = persistCancelSalesOrder(
      command.salesOrderId,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return toResult(order)
  })
}

export function executeCloseSalesOrder(command: SalesOrderLifecycleCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const order = persistCloseSalesOrder(
      command.salesOrderId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(order)
  })
}

export function executeArchiveSalesOrder(command: SalesOrderLifecycleCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const order = persistArchiveSalesOrder(
      command.salesOrderId,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(order)
  })
}

export function executeCreateRevision(command: CreateSalesOrderRevisionCommand): SalesOrderCommandResult {
  return runSalesOrderWriteCommand(() => {
    const order = persistCreateSalesOrderRevision(
      command.salesOrderId,
      command.reason,
      command.input,
      command.expectedVersion,
      command.actorUserId,
    )
    return toResult(order)
  })
}
