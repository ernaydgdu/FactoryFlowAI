/** MRP Run aggregate — immutable snapshot per revision */

export type MrpRunStatus = 'Draft' | 'Calculated' | 'Approved' | 'Released' | 'Archived'

export type MrpExceptionCode =
  | 'MISSING_BOM'
  | 'MISSING_PRODUCT_CARD'
  | 'NO_SUPPLIER'
  | 'NEGATIVE_STOCK'
  | 'LATE_PURCHASE'
  | 'LATE_PRODUCTION'
  | 'LOW_COVERAGE'

export type MrpException = {
  code: MrpExceptionCode
  message: string
  entityRef?: string
  severity: 'warning' | 'critical'
}

export type MrpLeadTimeBreakdown = {
  supplierDays: number
  productionDays: number
  transitDays: number
  totalDays: number
}

export type MrpSafetyStockPolicy = {
  minStock: number
  maxStock: number
  reorderPoint: number
}

export type MrpFabricLotLine = {
  lotNo: string
  availableQty: number
  reservedQty: number
  netAvailable: number
}

export type MrpVariantDemand = {
  orderId: string
  orderNo: string
  productCardId: string
  productCode: string
  colorId: string
  colorName: string
  size: string
  variantKey: string
  orderQty: number
  stockCardId: string
  materialCode: string
  grossRequired: number
  netRequired: number
}

export type MrpProductConsolidation = {
  productCardId: string
  productCode: string
  productName: string
  totalQuantity: number
  orderCount: number
  orders: { orderId: string; orderNo: string; quantity: number }[]
}

export type MrpOrderBreakdown = {
  orderId: string
  orderNo: string
  productCardId: string
  quantity: number
  variantCount: number
}

export type MrpSnapshotLine = {
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  grossRequirement: number
  netRequirement: number
  availableStock: number
  reservedStock: number
  openPurchaseQty: number
  openProductionQty: number
  netShortage: number
  purchaseRequirement: number
  productionRequirement: number
  safetyStock: MrpSafetyStockPolicy
  leadTime: MrpLeadTimeBreakdown
  fabricLots: MrpFabricLotLine[]
  orderBreakdown: MrpOrderBreakdown[]
  suggestedSupplier: string
  exceptionMessages: string[]
  exceptionCodes: MrpExceptionCode[]
}

export type MrpPurchaseSuggestion = {
  id: string
  stockCardId: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  supplier: string
  requiredDate: string
  leadTime: MrpLeadTimeBreakdown
  status: 'Pending' | 'Released' | 'Converted'
}

export type MrpPurchaseProposalGroup = {
  supplier: string
  totalQuantity: number
  lineCount: number
  earliestRequiredDate: string
  suggestionIds: string[]
}

export type MrpProductionSuggestion = {
  id: string
  salesOrderId: string
  orderNo: string
  productCardId: string
  productCode: string
  quantity: number
  workshopCode: string
  workshopName: string
  productionLineCode: string
  requiredDate: string
  capacityPerDay: number
  status: 'Pending' | 'Released' | 'Converted'
}

export type MrpProductionProposalGroup = {
  workshopCode: string
  workshopName: string
  productionLineCode: string
  capacityPerDay: number
  allocatedQty: number
  utilizationPercent: number
  suggestionIds: string[]
}

export type MrpSnapshot = {
  revisionNo: number
  generatedAt: string
  openOrderCount: number
  productConsolidations: MrpProductConsolidation[]
  variantDemands: MrpVariantDemand[]
  lines: MrpSnapshotLine[]
  purchaseSuggestions: MrpPurchaseSuggestion[]
  purchaseProposalGroups: MrpPurchaseProposalGroup[]
  productionSuggestions: MrpProductionSuggestion[]
  productionProposalGroups: MrpProductionProposalGroup[]
  exceptions: MrpException[]
  exceptionMessages: string[]
}

export type MrpRun = {
  id: string
  runNo: string
  status: MrpRunStatus
  currentSnapshot: MrpSnapshot
  snapshotHistory: MrpSnapshot[]
  createdAt: string
  updatedAt: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
}
