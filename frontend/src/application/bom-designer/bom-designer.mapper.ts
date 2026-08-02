import { getTextileProductById } from '@/domain/data/products'
import { calculateBomRequirement, validateBom } from '@/domain/services/textile/bom-service'

import type { BomDesignerViewDto, BomDesignerLineDto } from './bom-designer.dto'

const DEFAULT_ORDER_QTY = 1000

export function mapBomDesigner(productId: string, orderQty = DEFAULT_ORDER_QTY): BomDesignerViewDto | null {
  const card = getTextileProductById(productId)
  if (!card) return null

  const validation = validateBom(card.bom)
  const requirements = calculateBomRequirement(card.bom, orderQty)

  const lines: BomDesignerLineDto[] = requirements.map((l) => ({
    id: l.id,
    materialCode: l.materialCode,
    materialName: l.materialName,
    category: l.category,
    unit: l.unit,
    consumption: l.consumption,
    wastePercent: l.wastePercent,
    actualConsumption: l.actualConsumption,
    grossRequired: l.grossRequired,
    netRequired: l.netRequired,
    warehouseCode: l.warehouseCode,
    valid: { label: l.requirement === 'Zorunlu' ? 'Zorunlu' : 'Opsiyonel', tone: 'default' },
  }))

  return {
    productId: card.id,
    productCode: card.productCode,
    productName: card.productName,
    bomId: card.bom.id,
    revisionNo: card.bom.revisionNo,
    lineCount: lines.length,
    validationErrors: validation.errors,
    isValid: validation.valid,
    lines,
    orderQty,
  }
}
