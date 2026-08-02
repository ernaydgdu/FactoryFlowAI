import type { KpiDto, StatusBadgeDto, StatusTone, DocumentItemDto, RelationItemDto, TimelineItemDto } from '../core/types'

export type ProductCardListItemDto = {
  id: string
  productCode: string
  productName: string
  customer: string
  brand: string
  season: string
  sizeSetName: string
  colorCount: number
  bomLineCount: number
  status: StatusBadgeDto
}

export type ProductCardBomLineDto = {
  id: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  consumption: number
  wastePercent: number
  actualConsumption: number
  warehouseCode: string
  leadTimeDays: number
}

export type ProductCardColorDto = {
  id: string
  colorCode: string
  colorName: string
  pantone?: string
  isDefault: boolean
}

export type ProductCardSizeMatrixDto = {
  sizeSetName: string
  sizes: string[]
  totalRatio: number
}

export type ProductCardRevisionDto = {
  revisionNo: number
  status: string
  changedAt: string
  changedBy: string
  changeNote: string
}

export type ProductCardDetailDto = {
  id: string
  productCode: string
  productName: string
  customerModelNo: string
  internalModelNo: string
  status: StatusBadgeDto
  header: {
    customer: string
    brand: string
    buyer: string
    merchandiser: string
    season: string
    collection: string
  }
  classification: {
    productGroup: string
    subGroup: string
    gender: string
    ageGroup: string
    fit: string
    gtip: string
    countryOfOrigin: string
  }
  technical: {
    fabricType: string
    composition: string
    weight: string
    wash: string
    print: string
    embroidery: string
    pattern: string
    technicalSheetRef: string
    measurementChartId: string
  }
  bom: ProductCardBomLineDto[]
  colors: ProductCardColorDto[]
  sizeMatrix: ProductCardSizeMatrixDto
  revisions: ProductCardRevisionDto[]
  relations: RelationItemDto[]
  documents: DocumentItemDto[]
  timeline: TimelineItemDto[]
  operationRouteCount: number
  qualityPlanId: string
}

export type ProductCardKpisDto = {
  items: KpiDto[]
}

export function productCardStatusTone(status: string): StatusTone {
  if (status === 'Onaylı') return 'success'
  if (status === 'Üretimde') return 'default'
  return 'muted'
}

export function productCardStatusBadge(status: string): StatusBadgeDto {
  return { label: status, tone: productCardStatusTone(status) }
}
