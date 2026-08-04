import type {
  PackingList,
  PackageEntity,
  PackingListTotals,
  PackingListDocument,
  PackagingBrainReadModel,
} from '@/domain/packaging/packaging.types'

export type PackingListDto = PackingList
export type PackageDto = PackageEntity
export type PackingListTotalsDto = PackingListTotals
export type PackingListDocumentDto = PackingListDocument
export type PackagingBrainReadModelDto = PackagingBrainReadModel

export type PackagingDashboardDto = {
  kpis: Array<{ label: string; value: string }>
  lists: PackingListDto[]
}

export type CreatePackingListCommand = {
  salesOrderId: string
  productionOrderNo?: string
  warehouseCode?: string
  idempotencyKey: string
  actorUserId: string
}

export type AddPackageCommand = {
  packingListId: string
  kind: 'Carton' | 'Pallet'
  lines: { color: string; size: string; quantity: number; stockCardId?: string }[]
  netWeightKg: number
  tareWeightKg?: number
  dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number }
  parentPackageId?: string
  idempotencyKey: string
  actorUserId: string
}

export type AutoGenerateCommand = {
  salesOrderId: string
  productionOrderNo: string
  warehouseCode: string
  unitsPerCarton: number
  netWeightPerUnitKg: number
  tareWeightKg?: number
  idempotencyKey: string
  actorUserId: string
}

export type PackingListIdCommand = {
  packingListId: string
  actorUserId: string
}

export type PackingListIdempotentCommand = {
  packingListId: string
  idempotencyKey: string
  actorUserId: string
}

export type BindShipmentCommand = {
  packingListId: string
  warehouseCode: string
  stockCardId?: string
  idempotencyKey: string
  actorUserId: string
}

export type AssignContainerCommand = {
  packingListId: string
  containerCode: string
  packageIds?: string[]
  idempotencyKey: string
  actorUserId: string
}

export type NestPackageCommand = {
  packingListId: string
  childPackageId: string
  parentPackageId: string
  idempotencyKey: string
  actorUserId: string
}
