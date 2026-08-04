import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  InventoryDomainError,
  persistFinishedGoodsReceipt,
} from '@/domain/inventory/stock-ledger-crud.service'
import type { FinishedGoodsReceiptInput } from '@/domain/inventory/inventory.types'

export { InventoryDomainError }

export type WarehouseManagementCommandResult = {
  entityId: string
  entityNo: string
  status: string
  version: number
}

export type FinishedGoodsReceiptCommand = FinishedGoodsReceiptInput & { actorUserId: string }

export function executeFinishedGoodsReceipt(
  command: FinishedGoodsReceiptCommand,
): WarehouseManagementCommandResult {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    const result = persistFinishedGoodsReceipt(input, actorUserId)
    return {
      entityId: result.movement.id,
      entityNo: result.movement.movementNo,
      status: 'Posted',
      version: 1,
    }
  })
}
