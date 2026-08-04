import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  PackagingDomainError,
  persistAddPackage,
  persistAutoGenerateFromFinishedGoods,
  persistBindShipment,
  persistConfirmPackingList,
  persistCreatePackingList,
  persistValidatePackingList,
} from '@/domain/packaging/packing-list-crud.service'
import { queryAllPackingLists, queryPackingListById } from '@/domain/packaging/packing-list-query.service'

import type {
  AddPackageCommand,
  AutoGenerateCommand,
  BindShipmentCommand,
  CreatePackingListCommand,
  PackingListIdCommand,
} from './packaging.dto'

export { PackagingDomainError }

export function executeCreatePackingList(command: CreatePackingListCommand) {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    return persistCreatePackingList(input, actorUserId)
  })
}

export function executeAddPackage(command: AddPackageCommand) {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    return persistAddPackage(input, actorUserId)
  })
}

export function executeValidatePackingList(command: PackingListIdCommand) {
  return runCommandInTransaction(() =>
    persistValidatePackingList(command.packingListId, command.actorUserId),
  )
}

export function executeConfirmPackingList(command: PackingListIdCommand) {
  return runCommandInTransaction(() =>
    persistConfirmPackingList(command.packingListId, command.actorUserId),
  )
}

export function executeAutoGenerateFromFg(command: AutoGenerateCommand) {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    return persistAutoGenerateFromFinishedGoods(input, actorUserId)
  })
}

export function executeBindShipment(command: BindShipmentCommand) {
  return runCommandInTransaction(() => {
    const { actorUserId, ...input } = command
    return persistBindShipment(input, actorUserId)
  })
}

export function queryPackingLists() {
  return queryAllPackingLists()
}

export function queryPackingList(id: string) {
  return queryPackingListById(id)
}
