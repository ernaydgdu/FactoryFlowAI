import type { KpiDto, StatusBadgeDto } from '../core/types'

export type MrpExceptionDto = {
  code: string
  message: string
  entityRef?: string
  severity: string
}

export type MrpLineItemDto = {
  id: string
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  grossRequirement: number
  netRequirement: number
  availableStock: number
  reservedStock: number
  openPurchaseQty: number
  openProductionQty: number
  netShortage: number
  purchaseRequirement: number
  productionRequirement: number
  unit: string
  supplier: string
  leadTimeDays: number
  supplierLeadDays: number
  productionLeadDays: number
  transitLeadDays: number
  minStock: number
  maxStock: number
  reorderPoint: number
  fabricLotCount: number
  orderCount: number
  variantCount: number
  exceptionCount: number
  status: StatusBadgeDto
}

export type MrpPurchaseSuggestionDto = {
  id: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  supplier: string
  requiredDate: string
  leadTimeDays: number
  status: StatusBadgeDto
}

export type MrpPurchaseGroupDto = {
  supplier: string
  totalQuantity: number
  lineCount: number
  earliestRequiredDate: string
}

export type MrpProductionSuggestionDto = {
  id: string
  salesOrderId: string
  orderNo: string
  productCode: string
  quantity: number
  workshopCode: string
  workshopName: string
  productionLineCode: string
  capacityPerDay: number
  requiredDate: string
  status: StatusBadgeDto
}

export type MrpProductionGroupDto = {
  workshopCode: string
  workshopName: string
  productionLineCode: string
  capacityPerDay: number
  allocatedQty: number
  utilizationPercent: number
}

export type MrpProductConsolidationDto = {
  productCode: string
  productName: string
  totalQuantity: number
  orderCount: number
  orderNos: string[]
}

export type MrpRunSummaryDto = {
  id: string
  runNo: string
  status: StatusBadgeDto
  revisionNo: number
  generatedAt: string
  openOrderCount: number
  lineCount: number
  variantCount: number
  shortageCount: number
  version: number
}

export type MrpDashboardDto = {
  run: MrpRunSummaryDto | null
  lines: MrpLineItemDto[]
  purchaseSuggestions: MrpPurchaseSuggestionDto[]
  purchaseGroups: MrpPurchaseGroupDto[]
  productionSuggestions: MrpProductionSuggestionDto[]
  productionGroups: MrpProductionGroupDto[]
  productConsolidations: MrpProductConsolidationDto[]
  exceptions: MrpExceptionDto[]
  inventoryCoverage: { covered: number; total: number; percent: number }
}

export type MrpKpisDto = { items: KpiDto[] }
