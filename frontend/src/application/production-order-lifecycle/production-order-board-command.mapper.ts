import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  MaterialReservationError,
  persistMaterialReservationForOrder,
  releaseMaterialReservationForOrder,
} from '@/domain/production-order/material-reservation.service'

import type { ReserveMaterialsResultDto } from './production-order-board.dto'

export { MaterialReservationError }

export type ReserveMaterialsCommand = {
  productionOrderNo: string
  actorUserId: string
}

export function executeReserveMaterials(command: ReserveMaterialsCommand): ReserveMaterialsResultDto {
  return runCommandInTransaction(() => {
    const result = persistMaterialReservationForOrder(command.productionOrderNo, command.actorUserId)
    return {
      productionOrderNo: result.productionOrderNo,
      reservedCount: result.reservedCount,
      skippedCount: result.skippedCount,
    }
  })
}

export function executeReleaseMaterialReservation(
  command: ReserveMaterialsCommand,
): ReserveMaterialsResultDto {
  return runCommandInTransaction(() => {
    const result = releaseMaterialReservationForOrder(command.productionOrderNo, command.actorUserId)
    return {
      productionOrderNo: result.productionOrderNo,
      reservedCount: result.reservedCount,
      skippedCount: result.skippedCount,
    }
  })
}
