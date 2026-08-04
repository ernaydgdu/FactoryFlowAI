import { runPackagingWriteCommand } from './packaging-permission.guard'
import {
  PackagingDomainError,
  persistAddPackage,
  persistApprovePackingList,
  persistAssignContainer,
  persistAutoGenerateFromFinishedGoods,
  persistBindShipment,
  persistConfirmPackingList,
  persistCreatePackingList,
  persistNestPackage,
  persistRevisePackingList,
  persistSubmitPackingApproval,
  persistValidatePackingList,
} from '@/domain/packaging/packing-list-crud.service'
import {
  queryAllPackingLists,
  queryPackagingBrainReadModel,
  queryPackingListById,
} from '@/domain/packaging/packing-list-query.service'
import {
  buildPackageGs1128Label,
  buildPackingListDocument,
} from '@/domain/packaging/packaging-documents.service'

import type {
  AddPackageCommand,
  AssignContainerCommand,
  AutoGenerateCommand,
  BindShipmentCommand,
  CreatePackingListCommand,
  NestPackageCommand,
  PackingListIdCommand,
  PackingListIdempotentCommand,
} from './packaging.dto'

export { PackagingDomainError }

export function executeCreatePackingList(command: CreatePackingListCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreatePackingList(input, actorUserId)
  })
}

export function executeAddPackage(command: AddPackageCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAddPackage(input, actorUserId)
  })
}

export function executeValidatePackingList(command: PackingListIdCommand) {
  return runPackagingWriteCommand(() =>
    persistValidatePackingList(command.packingListId, command.actorUserId),
  )
}

export function executeConfirmPackingList(command: PackingListIdCommand) {
  return runPackagingWriteCommand(() =>
    persistConfirmPackingList(command.packingListId, command.actorUserId),
  )
}

export function executeSubmitPackingApproval(command: PackingListIdempotentCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistSubmitPackingApproval(input, actorUserId)
  })
}

export function executeApprovePackingList(command: PackingListIdempotentCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistApprovePackingList(input, actorUserId)
  })
}

export function executeRevisePackingList(command: PackingListIdempotentCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistRevisePackingList(input, actorUserId)
  })
}

export function executeAssignContainer(command: AssignContainerCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAssignContainer(input, actorUserId)
  })
}

export function executeNestPackage(command: NestPackageCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistNestPackage(input, actorUserId)
  })
}

export function executeAutoGenerateFromFg(command: AutoGenerateCommand) {
  return runPackagingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAutoGenerateFromFinishedGoods(input, actorUserId)
  })
}

export function executeBindShipment(command: BindShipmentCommand) {
  return runPackagingWriteCommand(() => {
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

export function queryPackagingBrain(salesOrderId?: string) {
  return queryPackagingBrainReadModel(salesOrderId)
}

export function queryPackingListPdf(id: string) {
  return buildPackingListDocument(id)
}

export function queryPackageLabel(packingListId: string, packageId: string) {
  return buildPackageGs1128Label(packingListId, packageId)
}
