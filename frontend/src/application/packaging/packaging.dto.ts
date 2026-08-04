import type { PackingList, PackageEntity, PackingListTotals } from '@/domain/packaging/packaging.types'

export type PackingListDto = PackingList
export type PackageDto = PackageEntity
export type PackingListTotalsDto = PackingListTotals

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

export type BindShipmentCommand = {
  packingListId: string
  warehouseCode: string
  stockCardId?: string
  idempotencyKey: string
  actorUserId: string
}
