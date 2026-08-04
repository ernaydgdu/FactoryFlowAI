import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  InventoryDomainError,
  persistCycleCount,
  persistGoodsIssue,
  persistReservation,
  persistReservationRelease,
  persistShipment,
  persistStockAdjustment,
  persistStockTransfer,
} from '@/domain/inventory/stock-ledger-crud.service'
import type {
  CycleCountInput,
  GoodsIssueInput,
  ShipmentInput,
  StockAdjustmentInput,
  StockReservationInput,
  StockTransferInput,
} from '@/domain/inventory/inventory.types'
import {
  persistPostGoodsReceipt,
  GoodsReceiptDomainError,
  type CreateGoodsReceiptInput,
} from '@/domain/purchasing/goods-receipt-crud.service'

export { InventoryDomainError, GoodsReceiptDomainError }

export type InventoryCommandResult = {
  entityId: string
  entityNo: string
  status: string
  version: number
}

export type GoodsReceiptCommand = CreateGoodsReceiptInput & { actorUserId: string }
export type GoodsIssueCommand = GoodsIssueInput & { actorUserId: string }
export type ShipmentCommand = ShipmentInput & { actorUserId: string }
export type TransferCommand = StockTransferInput & { actorUserId: string }
export type ReservationCommand = StockReservationInput & { actorUserId: string }
export type AdjustmentCommand = StockAdjustmentInput & { actorUserId: string }
export type CycleCountCommand = CycleCountInput & { actorUserId: string }

export function executeGoodsReceipt(command: GoodsReceiptCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const gr = persistPostGoodsReceipt(input, actorUserId)
    return { entityId: gr.id, entityNo: gr.grNo, status: gr.status, version: 1 }
  })
}

export function executeGoodsIssue(command: GoodsIssueCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistGoodsIssue(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}

export function executeShipment(command: ShipmentCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistShipment(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}

export function executeTransfer(command: TransferCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistStockTransfer(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}

export function executeReservation(command: ReservationCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistReservation(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Reserved',
      version: 1,
    }
  })
}

export function executeReservationRelease(command: ReservationCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistReservationRelease(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Released',
      version: 1,
    }
  })
}

export function executeAdjustment(command: AdjustmentCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistStockAdjustment(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}

export function executeCycleCount(command: CycleCountCommand): InventoryCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistCycleCount(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}
