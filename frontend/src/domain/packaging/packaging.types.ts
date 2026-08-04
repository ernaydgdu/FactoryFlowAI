/**
 * Packaging & Packing List — domain types.
 * PackingList aggregate embeds Package (Carton | Pallet) handling units.
 */

export type PackageKind = 'Carton' | 'Pallet'

export type PackageStatus = 'Open' | 'Closed' | 'Shipped'

export type PackingListStatus =
  | 'Draft'
  | 'Validated'
  | 'PendingApproval'
  | 'Approved'
  | 'Confirmed'
  | 'Shipped'
  | 'Cancelled'

export type PackingApprovalStatus = 'None' | 'Pending' | 'Approved' | 'Rejected'

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

/** Handling unit — Carton may nest under Pallet via parentPackageId. */
export type PackageEntity = {
  id: string
  packageNo: string
  kind: PackageKind
  /** GS1 SSCC-18 digital string (AI 00) */
  sscc: string
  barcode: string
  /** GS1-128 AI skeleton for label print */
  gs1128: string
  lines: PackageLine[]
  netWeightKg: number
  tareWeightKg: number
  grossWeightKg: number
  dimensions: PackageDimensionsCm
  volumeCbm: number
  status: PackageStatus
  parentPackageId: string | null
  containerCode: string | null
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
  revision: number
  previousRevisionId: string | null
  approvalStatus: PackingApprovalStatus
  approvedBy: string | null
  approvedAt: string | null
  packages: PackageEntity[]
  totals: PackingListTotals
  containerCode: string | null
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
  parentPackageId?: string
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

export type AssignContainerInput = {
  packingListId: string
  containerCode: string
  packageIds?: string[]
  idempotencyKey: string
}

export type NestPackageInput = {
  packingListId: string
  childPackageId: string
  parentPackageId: string
  idempotencyKey: string
}

export type PackingListIdempotentInput = {
  packingListId: string
  idempotencyKey: string
}

/** Printable packing list document (PDF payload — no binary PDF lib). */
export type PackingListDocument = {
  documentType: 'PACKING_LIST'
  packingListNo: string
  revision: number
  salesOrderNo: string
  productionOrderNo: string | null
  warehouseCode: string | null
  containerCode: string | null
  status: PackingListStatus
  approvalStatus: PackingApprovalStatus
  issuedAt: string
  totals: PackingListTotals
  lines: Array<{
    packageNo: string
    kind: PackageKind
    sscc: string
    gs1128: string
    parentPackageNo: string | null
    containerCode: string | null
    color: string
    size: string
    quantity: number
    netWeightKg: number
    grossWeightKg: number
    volumeCbm: number
  }>
}

/** AI / Brain read-model — read-only, no mutations. */
export type PackagingBrainReadModel = {
  salesOrderId: string | null
  packingListCount: number
  confirmedOrApproved: number
  pendingApproval: number
  shipped: number
  totalPackages: number
  totalQty: number
  totalCbm: number
  openValidationErrors: number
  lists: Array<{
    id: string
    packingListNo: string
    status: PackingListStatus
    revision: number
    approvalStatus: PackingApprovalStatus
    packageCount: number
    totalQty: number
    volumeCbm: number
    containerCode: string | null
    shipmentReferenceNo: string | null
  }>
}
