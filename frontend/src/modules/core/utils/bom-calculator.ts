import type { BomLine } from '@/domain/types'
import { getStockCardById } from '@/domain/data/stock-cards'
import { getDefaultWorkshopName } from '@/domain/master-data/ui-options-defaults'
import {
  calcActualConsumption,
  computeMatrixTotals,
  generateMrp,
  calculateConsumptions,
  enrichBomLine,
} from '@/domain/services/calculations'

export {
  calcActualConsumption,
  computeMatrixTotals,
  generateMrp,
  calculateConsumptions,
  enrichBomLine,
}

export { createDefaultBomLines, DEFAULT_BOM_TEMPLATE } from './bom-legacy'

export type { BomLine, MrpLine, MaterialRequirementPlan } from '@/domain/types'

export type MaterialRequirement = {
  stockCardId: string
  code: string
  name: string
  category: string
  unit: string
  quantityPerUnit: number
  orderQuantity: number
  totalRequired: number
}

export function calculateMaterialRequirements(
  bomLines: BomLine[],
  orderQuantity: number,
): MaterialRequirement[] {
  return bomLines
    .filter((l) => l.stockCardId && l.consumption > 0)
    .map((line) => {
      const card = getStockCardById(line.stockCardId)!
      const totalRequired =
        Math.round(line.actualConsumption * orderQuantity * 100) / 100
      return {
        stockCardId: card.id,
        code: card.code,
        name: card.name,
        category: card.category,
        unit: card.unit,
        quantityPerUnit: line.actualConsumption,
        orderQuantity,
        totalRequired,
      }
    })
}

export function formatRequirementSummary(
  requirements: MaterialRequirement[],
): string {
  if (!requirements.length) return 'Malzeme ihtiyacı hesaplanamadı.'
  return requirements
    .map(
      (r) =>
        `${r.name}: ${r.quantityPerUnit} ${r.unit}/adet × ${r.orderQuantity} = ${r.totalRequired} ${r.unit}`,
    )
    .join('\n')
}

export function calculateConsumption(bomLines: BomLine[], producedQty: number) {
  return calculateConsumptions(bomLines, producedQty, getDefaultWorkshopName())
}
