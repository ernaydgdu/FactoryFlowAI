import type { StatusBadgeDto } from '../core/types'

export type BomDesignerLineDto = {
  id: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  consumption: number
  wastePercent: number
  actualConsumption: number
  grossRequired: number
  netRequired: number
  warehouseCode: string
  valid: StatusBadgeDto
}

export type BomDesignerViewDto = {
  productId: string
  productCode: string
  productName: string
  bomId: string
  revisionNo: number
  lineCount: number
  validationErrors: string[]
  isValid: boolean
  lines: BomDesignerLineDto[]
  orderQty: number
}
