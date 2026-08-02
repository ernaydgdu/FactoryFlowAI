import type { BomLine } from '@/domain/types'
import { calcActualConsumption } from '@/domain/services/calculations'
import { getStockCardById } from '@/domain/data/stock-cards'

export const DEFAULT_BOM_TEMPLATE: Omit<BomLine, 'id' | 'actualConsumption'>[] = [
  { stockCardId: 'sc-1', consumption: 1.55, wastePercent: 3 },
  { stockCardId: 'sc-6', consumption: 0.22, wastePercent: 5 },
  { stockCardId: 'sc-8', consumption: 8, wastePercent: 2 },
  { stockCardId: 'sc-10', consumption: 2, wastePercent: 0 },
  { stockCardId: 'sc-13', consumption: 1, wastePercent: 0 },
  { stockCardId: 'sc-16', consumption: 0.18, wastePercent: 5 },
  { stockCardId: 'sc-18', consumption: 1, wastePercent: 0 },
  { stockCardId: 'sc-21', consumption: 0.021, wastePercent: 0 },
]

export function createDefaultBomLines(): BomLine[] {
  return DEFAULT_BOM_TEMPLATE.map((line, i) => ({
    id: `bom-${i + 1}`,
    ...line,
    actualConsumption: calcActualConsumption(line.consumption, line.wastePercent),
  }))
}

export function getBomLineStockCard(line: BomLine) {
  return getStockCardById(line.stockCardId)
}
