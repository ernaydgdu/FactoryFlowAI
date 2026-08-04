import { runShipmentWriteCommand } from './shipment-permission.guard'
import {
  ShipmentDomainError,
  persistAddLoadFromPackingList,
  persistCreateShipment,
  persistPostShipmentInventory,
  persistTransitionShipment,
  persistUpdateShipmentLogistics,
} from '@/domain/shipment/shipment-crud.service'
import { queryAllShipments, queryShipmentById } from '@/domain/shipment/shipment-query.service'

import type {
  AddLoadCommand,
  CreateShipmentCommand,
  PostInventoryCommand,
  TransitionShipmentCommand,
  UpdateShipmentLogisticsCommand,
} from './shipment.dto'

export { ShipmentDomainError }

export function executeCreateShipment(command: CreateShipmentCommand) {
  return runShipmentWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreateShipment(input, actorUserId)
  })
}

export function executeUpdateLogistics(command: UpdateShipmentLogisticsCommand) {
  return runShipmentWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistUpdateShipmentLogistics(input, actorUserId)
  })
}

export function executeAddLoad(command: AddLoadCommand) {
  return runShipmentWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAddLoadFromPackingList(input, actorUserId)
  })
}

export function executeTransition(command: TransitionShipmentCommand) {
  return runShipmentWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistTransitionShipment(input, actorUserId)
  })
}

export function executePostInventory(command: PostInventoryCommand) {
  return runShipmentWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistPostShipmentInventory(input, actorUserId)
  })
}

export function queryShipments() {
  return queryAllShipments()
}

export function queryShipment(id: string) {
  return queryShipmentById(id)
}
