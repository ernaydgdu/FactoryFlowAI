/**
 * Packaging & Packing List — domain types.
 * PackingList aggregate embeds Package (Carton | Pallet) entities.
 */

export type PackageKind = 'Carton' | 'Pallet'

export type PackageStatus = 'Open' | 'Closed' | 'Shipped'

export type PackingListStatus = 'Draft' | 'Validated' | 'Confirmed' | 'Shipped' | 'Cancelled'

export type PackageLine = {
  id: string
  color: string
  size: string
  quantity: number
  stockCardId?: string
}

export type PackageDimensionsCm = {
  lengthCm: number
  widthCm: number
  heightCm: number
}

export type PackageEntity = {
  id: string
  packageNo: string
  kind: PackageKind
  /** GS1 SSCC-18 digital string (AI 00), no binary encoder */
  sscc: string
  barcode: string
  lines: PackageLine[]
  netWeightKg: number
  tareWeightKg: number
  grossWeightKg: number
  dimensions: PackageDimensionsCm
  volumeCbm: number
  status: PackageStatus
  createdAt: string
}

export type PackingListTotals = {
  packageCount: number
  cartonCount: number
  palletCount: number
  totalQty: number
  netWeightKg: number
  grossWeightKg: number
  volumeCbm: number
}

export type PackingList = {
  id: string
  packingListNo: string
  salesOrderId: string
  salesOrderNo: string
  productionOrderNo: string | null
  warehouseCode: string | null
  status: PackingListStatus
  packages: PackageEntity[]
  totals: PackingListTotals
  /** Links to stock ledger SHIPMENT movement referenceNo when bound */
  shipmentReferenceNo: string | null
  shipmentMovementId: string | null
  validationErrors: string[]
  idempotencyKey: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreatePackingListInput = {
  salesOrderId: string
  productionOrderNo?: string
  warehouseCode?: string
  idempotencyKey: string
}

export type AddPackageInput = {
  packingListId: string
  kind: PackageKind
  lines: { color: string; size: string; quantity: number; stockCardId?: string }[]
  netWeightKg: number
  tareWeightKg?: number
  dimensions?: Partial<PackageDimensionsCm>
  idempotencyKey: string
}

export type AutoGenerateFromFgInput = {
  salesOrderId: string
  productionOrderNo: string
  warehouseCode: string
  unitsPerCarton: number
  netWeightPerUnitKg: number
  tareWeightKg?: number
  dimensions?: Partial<PackageDimensionsCm>
  idempotencyKey: string
}

export type BindShipmentInput = {
  packingListId: string
  warehouseCode: string
  stockCardId?: string
  idempotencyKey: string
}
