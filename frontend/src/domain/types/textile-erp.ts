/**
 * Textile ERP — profesyonel tekstil domain modeli.
 * Tüm referans alanları master data ID/code ile; hardcoded string yok.
 */

import type { MasterEntityStatus } from '../master-data/types'

// ─── Lookup master refs ───────────────────────────────────────────

export type GenderRef = { id: string; code: string; name: string }
export type AgeGroupRef = { id: string; code: string; name: string }
export type FitRef = { id: string; code: string; name: string }
export type WashTypeRef = { id: string; code: string; name: string }
export type PrintTypeRef = { id: string; code: string; name: string }
export type EmbroideryTypeRef = { id: string; code: string; name: string }
export type GtipRef = { id: string; code: string; name: string; description: string }

// ─── Color Card ───────────────────────────────────────────────────

export type ColorCardEntity = {
  id: string
  code: string
  name: string
  pantone: string
  customerColorCode: string
  internalColorCode: string
  description: string
  rgb: { r: number; g: number; b: number }
  hex: string
  colorGroupId: string
  status: MasterEntityStatus
}

export type ProductColorAssignment = {
  id: string
  colorCardId: string
  sortOrder: number
  active: boolean
}

// ─── Size Set ─────────────────────────────────────────────────────

export type SizeSetCategory = 'LETTER' | 'NUMERIC' | 'BABY' | 'KIDS' | 'CUSTOM'

export type SizeSetEntity = {
  id: string
  code: string
  name: string
  productType: string
  category: SizeSetCategory
  sizes: string[]
  status: MasterEntityStatus
}

export type MeasurementChart = {
  id: string
  productCardId: string
  sizeSetId: string
  points: Array<{ code: string; label: string; values: Record<string, number> }>
  revisionNo: number
}

// ─── BOM ──────────────────────────────────────────────────────────

export type BomLineRequirement = 'Zorunlu' | 'Opsiyonel'

export type BomLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Active'
  | 'Archived'

export type BomRevisionSnapshot = {
  revisionNo: number
  status: BomLifecycleStatus
  changedAt: string
  changedById: string
  changeNote: string
  lineCount: number
  entityRevisionId?: string
}

export type BomLineDetail = {
  id: string
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  consumption: number
  wastePercent: number
  netConsumption: number
  actualConsumption: number
  alternativeStockCardId?: string
  warehouseCode: string
  supplierId: string
  leadTimeDays: number
  lotTracking: boolean
  requirement: BomLineRequirement
  notes?: string
}

export type BillOfMaterials = {
  id: string
  productCardId: string
  revisionNo: number
  status: BomLifecycleStatus
  lines: BomLineDetail[]
  generatedAt: string
  revisionHistory: BomRevisionSnapshot[]
  activeRevisionRecordId?: string
}

// ─── Planned Cost Sheet ───────────────────────────────────────────

export type CostSheetLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Active'
  | 'Archived'

export type CostSheetLineKey =
  | 'fabric'
  | 'accessory'
  | 'thread'
  | 'print'
  | 'embroidery'
  | 'washing'
  | 'cutting'
  | 'sewing'
  | 'ironing'
  | 'packaging'
  | 'waste'
  | 'logistics'
  | 'overhead'
  | 'profitMargin'

export type CostSheetLineItem = {
  key: CostSheetLineKey
  label: string
  amount: number
  unitAmount: number
  bomDerived: boolean
  isManualOverride: boolean
  notes?: string
}

export type CostSheetRevisionSnapshot = {
  revisionNo: number
  status: CostSheetLifecycleStatus
  changedAt: string
  changedById: string
  changeNote: string
  totalPlannedCost: number
  entityRevisionId?: string
}

export type PlannedCostSheet = {
  id: string
  productCardId: string
  revisionNo: number
  status: CostSheetLifecycleStatus
  lines: CostSheetLineItem[]
  quantityBasis: number
  totalPlannedCost: number
  unitPlannedCost: number
  fob: number
  cm: number
  profitMarginPercent: number
  generatedAt: string
  revisionHistory: CostSheetRevisionSnapshot[]
  activeRevisionRecordId?: string
  bomRevisionNo?: number
}

// ─── Fabric Card ──────────────────────────────────────────────────

export type FabricCard = {
  id: string
  stockCardId: string
  code: string
  name: string
  fabricTypeId: string
  compositionId: string
  weightGsm: number
  widthCm: number
  shrinkagePercent: number
  lycraPercent: number
  lot?: string
  rollNo?: string
  batchNo?: string
  qualityGrade: 'A' | 'B' | 'C' | 'Reject'
  supplierId: string
  warehouseCode: string
  leadTimeDays: number
  unit: string
}

// ─── Accessory Card (category-specific) ───────────────────────────

export type AccessoryCategoryCode = 'ZIPPER' | 'BUTTON' | 'THREAD' | 'LABEL' | 'PACKAGING'

export type ZipperAttributes = {
  lengthCm: number
  type: string
  direction: 'Sol' | 'Sağ'
  colorCode: string
  brand: string
}

export type ButtonAttributes = {
  diameterMm: number
  holes: string
  material: string
  coating: string
}

export type ThreadAttributes = {
  tex: number
  ne: number
  coneWeightGram: number
  colorCode: string
}

export type LabelAttributes = {
  labelType: 'Dokuma' | 'Baskı'
  folding: string
  language: string
}

export type AccessoryCard = {
  id: string
  stockCardId: string
  code: string
  name: string
  categoryCode: AccessoryCategoryCode
  unit: string
  supplierId: string
  warehouseCode: string
  leadTimeDays: number
  attributes: ZipperAttributes | ButtonAttributes | ThreadAttributes | LabelAttributes | Record<string, string | number>
}

// ─── Warehouse Hierarchy ──────────────────────────────────────────

export type WarehouseNodeType =
  | 'ROOT'
  | 'GROUP'
  | 'WAREHOUSE'

export type WarehouseHierarchyNode = {
  id: string
  code: string
  name: string
  type: WarehouseNodeType
  warehouseType?: string
  parentId?: string
  childIds: string[]
  warehouseCode?: string
  sortOrder: number
}

// ─── Purchase Chain ───────────────────────────────────────────────

export type PurchaseChainStage =
  | 'MRP'
  | 'PURCHASE_REQUEST'
  | 'PURCHASE_ORDER'
  | 'PARTIAL_RECEIPT'
  | 'WAREHOUSE_RECEIPT'
  | 'RESERVATION'
  | 'CONSUMPTION'
  | 'REMAINING_STOCK'

export type PurchaseChainLink = {
  stage: PurchaseChainStage
  entityId: string
  entityNo: string
  quantity: number
  unit: string
  status: string
  occurredAt: string
}

export type PurchaseChainTrace = {
  orderId: string
  orderNo: string
  stockCardId: string
  links: PurchaseChainLink[]
  orderedQty: number
  receivedQty: number
  reservedQty: number
  consumedQty: number
  remainingQty: number
  complete: boolean
}

// ─── Production Tracking ──────────────────────────────────────────

export type OperationProgress = {
  operationId: string
  operationCode: string
  operationName: string
  sequence: number
  plannedQty: number
  completedQty: number
  wasteQty: number
  reworkQty: number
  secondQualityQty: number
  repairQty: number
  progressPercent: number
  lineId?: string
  operatorId?: string
  machineId?: string
  workshopCode: string
}

export type ProductionTrackingSnapshot = {
  productionOrderId: string
  productionOrderNo: string
  orderId: string
  plannedQty: number
  producedQty: number
  wasteQty: number
  missingQty: number
  reworkQty: number
  secondQualityQty: number
  repairQty: number
  progressPercent: number
  operations: OperationProgress[]
  oee: number
  efficiency: number
  capacityUtilization: number
}

// ─── Costing ──────────────────────────────────────────────────────

export type TextileCostBreakdown = {
  orderId: string
  orderNo: string
  quantity: number
  fabric: number
  accessory: number
  labor: number
  washing: number
  embroidery: number
  print: number
  packaging: number
  logistics: number
  commission: number
  waste: number
  overhead: number
  totalCost: number
  cm: number
  fob: number
  sellingPrice: number
  grossProfit: number
  netProfit: number
  grossMarginPercent: number
  netMarginPercent: number
  unitFob: number
  unitCm: number
  structure: Array<{ key: string; label: string; amount: number; percent: number }>
}

// ─── Product Card (ERP center) ────────────────────────────────────

import type { ProductCardLifecycleStatus } from '../product-card/lifecycle-types'

export type ProductCardRevision = {
  revisionNo: number
  status: ProductCardLifecycleStatus
  changedAt: string
  changedById: string
  changeNote: string
}

export type ProductCardMasterRefs = {
  customerId: string
  brandId: string
  buyerId: string
  merchandiserId: string
  seasonId: string
  collectionId: string
  productGroupId: string
  subProductGroupId: string
  genderId: string
  ageGroupId: string
  fitId: string
  countryOfOriginId: string
  gtipId: string
  fabricTypeId: string
  fabricCompositionId: string
  washTypeId: string
  printTypeId: string
  embroideryTypeId: string
  mainFabricStockCardId: string
  auxiliaryFabricStockCardIds: string[]
  sizeSetId: string
}

export type ProductCardResolvedView = {
  customer: string
  brand: string
  buyer: string
  merchandiser: string
  season: string
  collection: string
  productGroup: string
  subGroup: string
  gender: string
  ageGroup: string
  fit: string
  countryOfOrigin: string
  gtip: string
  fabricType: string
  composition: string
  wash: string
  print: string
  embroidery: string
  mainFabric: string
}

export type TextileProductCard = {
  id: string
  productCode: string
  customerModelNo: string
  internalModelNo: string
  productName: string
  pattern: string
  weight: string
  description: string
  technicalSheetRef?: string
  measurementChartId?: string
  refs: ProductCardMasterRefs
  resolved: ProductCardResolvedView
  colorAssignments: ProductColorAssignment[]
  bom: BillOfMaterials
  costSheet: PlannedCostSheet
  currentRevision: ProductCardRevision
  revisionHistory: ProductCardRevision[]
  status: ProductCardRevision['status']
}

// ─── Brain Entity Registry ────────────────────────────────────────

export type TextileEntityKind =
  | 'PRODUCT_CARD'
  | 'COLOR_CARD'
  | 'SIZE_SET'
  | 'BOM'
  | 'COST_SHEET'
  | 'FABRIC_CARD'
  | 'ACCESSORY_CARD'
  | 'WAREHOUSE_NODE'
  | 'PURCHASE_CHAIN'
  | 'PRODUCTION_TRACKING'
  | 'COST_BREAKDOWN'

export type TextileEntitySnapshot = {
  kind: TextileEntityKind
  entityId: string
  label: string
  attributes: Record<string, unknown>
  sourceModule: string
}
