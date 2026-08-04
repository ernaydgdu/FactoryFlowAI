import type { ProductCardLifecycleStatus } from '@/domain/product-card/lifecycle-types'

export type ProductCardCommandResult = {
  id: string
  productCode: string
  status: ProductCardLifecycleStatus
  version: number
}

export type CreateProductCardCommand = {
  productCode: string
  productName: string
  customerModelNo?: string
  internalModelNo?: string
  pattern?: string
  weight?: string
  description?: string
  customerId?: string
  brandId?: string
  buyerId?: string
  seasonId?: string
  collectionId?: string
  sizeSetId?: string
  actorUserId: string
}

export type UpdateProductCardCommand = {
  id: string
  expectedVersion: number
  productCode?: string
  productName?: string
  customerModelNo?: string
  internalModelNo?: string
  pattern?: string
  weight?: string
  description?: string
  customerId?: string
  brandId?: string
  seasonId?: string
  sizeSetId?: string
  actorUserId: string
}

export type ProductCardLifecycleCommand = {
  id: string
  expectedVersion: number
  actorUserId: string
  comment?: string
  reason?: string
}

export type CreateRevisionCommand = ProductCardLifecycleCommand & {
  reason: string
}

export function productCardLifecycleLabel(status: ProductCardLifecycleStatus): string {
  const labels: Record<ProductCardLifecycleStatus, string> = {
    Draft: 'Taslak',
    'Under Review': 'İncelemede',
    Approved: 'Onaylı',
    'In Production': 'Üretimde',
    Closed: 'Kapalı',
    Archived: 'Arşiv',
  }
  return labels[status] ?? status
}

export function productCardStatusTone(status: ProductCardLifecycleStatus): import('../core/types').StatusTone {
  if (status === 'Approved') return 'success'
  if (status === 'In Production') return 'default'
  if (status === 'Under Review') return 'warning'
  if (status === 'Archived') return 'muted'
  if (status === 'Closed') return 'muted'
  return 'muted'
}

export function productCardStatusBadge(status: ProductCardLifecycleStatus): import('../core/types').StatusBadgeDto {
  return { label: productCardLifecycleLabel(status), tone: productCardStatusTone(status) }
}

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
  status: import('../core/types').StatusBadgeDto
  lifecycleStatus: ProductCardLifecycleStatus
  version: number
  editable: boolean
  readOnly: boolean
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
  status: import('../core/types').StatusBadgeDto
  lifecycleStatus: ProductCardLifecycleStatus
  version: number
  editable: boolean
  readOnly: boolean
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
  relations: import('../core/types').RelationItemDto[]
  documents: import('../core/types').DocumentItemDto[]
  timeline: import('../core/types').TimelineItemDto[]
  operationRouteCount: number
  qualityPlanId: string
}

export type ProductCardKpisDto = {
  items: import('../core/types').KpiDto[]
}

export type ProductCardFormDto = {
  productCode: string
  productName: string
  customerModelNo: string
  internalModelNo: string
  pattern: string
  weight: string
  description: string
  customerId: string
  brandId: string
  seasonId: string
  sizeSetId: string
}

export type ProductCardEditDto = ProductCardFormDto & {
  id: string
  version: number
  lifecycleStatus: ProductCardLifecycleStatus
  editable: boolean
}
