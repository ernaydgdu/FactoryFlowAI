/**
 * MRP stock policy — safety stock, lead times, fabric lots from Stock Card repository.
 */
import type { StockCard } from '@/domain/types'

import type { MrpFabricLotLine, MrpLeadTimeBreakdown, MrpSafetyStockPolicy } from './mrp.types'

function numAttr(card: StockCard, key: string, fallback: number): number {
  const v = card.attributes[key]
  return typeof v === 'number' ? v : fallback
}

export function readSafetyStockPolicy(card: StockCard): MrpSafetyStockPolicy {
  const minStock = numAttr(card, 'minStock', Math.max(card.minOrderQty, card.availableQty * 0.1))
  const maxStock = numAttr(card, 'maxStock', Math.max(minStock * 4, card.availableQty * 1.5))
  const reorderPoint = numAttr(card, 'reorderPoint', minStock * 1.2)
  return {
    minStock: Math.round(minStock * 100) / 100,
    maxStock: Math.round(maxStock * 100) / 100,
    reorderPoint: Math.round(reorderPoint * 100) / 100,
  }
}

export function readLeadTimeBreakdown(card: StockCard): MrpLeadTimeBreakdown {
  const supplierDays = numAttr(card, 'supplierLeadDays', card.leadTimeDays)
  const productionDays = numAttr(card, 'productionLeadDays', card.category === 'Kumaş' ? 0 : 5)
  const transitDays = numAttr(card, 'transitLeadDays', 3)
  return {
    supplierDays,
    productionDays,
    transitDays,
    totalDays: supplierDays + productionDays + transitDays,
  }
}

export function readFabricLots(card: StockCard): MrpFabricLotLine[] {
  if (card.category !== 'Kumaş') return []

  const lots: MrpFabricLotLine[] = []
  for (let i = 1; i <= 5; i += 1) {
    const lotNo = card.attributes[`lot${i}No`]
    const lotQty = card.attributes[`lot${i}Qty`]
    if (typeof lotNo === 'string' && typeof lotQty === 'number' && lotQty > 0) {
      const reserved = numAttr(card, `lot${i}Reserved`, 0)
      lots.push({
        lotNo,
        availableQty: lotQty,
        reservedQty: reserved,
        netAvailable: Math.max(0, lotQty - reserved),
      })
    }
  }

  if (lots.length === 0 && card.availableQty > 0) {
    lots.push({
      lotNo: card.lot ?? 'DEFAULT',
      availableQty: card.availableQty,
      reservedQty: 0,
      netAvailable: card.availableQty,
    })
  }

  return lots
}

export function effectiveAvailableFromLots(card: StockCard): number {
  const lots = readFabricLots(card)
  if (lots.length > 0) return lots.reduce((s, l) => s + l.netAvailable, 0)
  return card.availableQty
}

export function applySafetyStockToRequirement(
  netRequirement: number,
  policy: MrpSafetyStockPolicy,
  available: number,
): number {
  const belowReorder = available < policy.reorderPoint
  const safetyBuffer = belowReorder ? Math.max(0, policy.reorderPoint - available) : 0
  const capped = Math.min(netRequirement + safetyBuffer, policy.maxStock)
  return Math.max(netRequirement, capped > netRequirement ? capped - available : netRequirement)
}
