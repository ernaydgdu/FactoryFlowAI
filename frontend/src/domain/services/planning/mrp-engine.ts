import type {
  ConsolidatedMrp,
  ConsolidatedMrpLine,
  PurchaseSuggestion,
} from '../../types/planning'
import type { SalesOrder } from '../../types'
import { STOCK_CARDS, getStockCardById } from '../../data/stock-cards'

function isOpenOrder(order: SalesOrder): boolean {
  return order.productionStatus !== 'Sevk Edildi' && order.productionStatus !== 'Tamamlandı'
}

/**
 * MRP Motoru — açık siparişleri tarar, malzeme ihtiyaçlarını birleştirir.
 * Örn: A 1550m + B 800m + C 600m = 2950m tek satın alma önerisi
 */
export function consolidateMrp(
  orders: SalesOrder[],
  referenceDate: Date = new Date('2026-08-02'),
): ConsolidatedMrp {
  const openOrders = orders.filter(isOpenOrder)
  const lineMap = new Map<string, ConsolidatedMrpLine>()

  for (const order of openOrders) {
    for (const mrpLine of order.mrp.lines) {
      const key = mrpLine.stockCardId
      const existing = lineMap.get(key)

      if (existing) {
        existing.totalRequired += mrpLine.netRequired
        existing.orderBreakdown.push({
          orderId: order.id,
          orderNo: order.orderNo,
          quantity: mrpLine.netRequired,
        })
      } else {
        const card = getStockCardById(mrpLine.stockCardId)
        lineMap.set(key, {
          stockCardId: mrpLine.stockCardId,
          materialCode: mrpLine.code,
          materialName: mrpLine.materialName,
          category: mrpLine.category,
          unit: mrpLine.unit,
          totalRequired: mrpLine.netRequired,
          onHand: card?.availableQty ?? 0,
          netToPurchase: 0,
          orderBreakdown: [
            { orderId: order.id, orderNo: order.orderNo, quantity: mrpLine.netRequired },
          ],
          suggestedSupplier: mrpLine.supplier,
          leadTimeDays: mrpLine.leadTimeDays,
        })
      }
    }
  }

  const lines = Array.from(lineMap.values()).map((line) => ({
    ...line,
    totalRequired: Math.round(line.totalRequired * 100) / 100,
    netToPurchase: Math.max(0, Math.round((line.totalRequired - line.onHand) * 100) / 100),
  }))

  lines.sort((a, b) => b.netToPurchase - a.netToPurchase)

  const purchaseSuggestions: PurchaseSuggestion[] = lines
    .filter((l) => l.netToPurchase > 0)
    .map((l) => ({
      materialCode: l.materialCode,
      materialName: l.materialName,
      quantity: l.netToPurchase,
      unit: l.unit,
      supplier: l.suggestedSupplier,
      consolidatedFromOrders: l.orderBreakdown.length,
    }))

  return {
    generatedAt: referenceDate.toISOString(),
    openOrderCount: openOrders.length,
    lines,
    purchaseSuggestions,
  }
}

export function getMaterialRequirementByCode(
  consolidated: ConsolidatedMrp,
  materialCode: string,
): ConsolidatedMrpLine | undefined {
  return consolidated.lines.find((l) => l.materialCode === materialCode)
}

/** Demo: belirli kumaş kodu için birleşik ihtiyaç */
export function demoConsolidatedFabricRequirement(
  orders: SalesOrder[],
): ConsolidatedMrpLine | undefined {
  const mrp = consolidateMrp(orders)
  return mrp.lines.find((l) => l.category === 'Kumaş')
}

/** Stok kartlarından güncel onHand ile zenginleştir */
export function refreshMrpOnHand(consolidated: ConsolidatedMrp): ConsolidatedMrp {
  const lines = consolidated.lines.map((line) => {
    const card = STOCK_CARDS.find((s) => s.id === line.stockCardId)
    const onHand = card?.availableQty ?? line.onHand
    return {
      ...line,
      onHand,
      netToPurchase: Math.max(0, Math.round((line.totalRequired - onHand) * 100) / 100),
    }
  })

  return {
    ...consolidated,
    lines,
    purchaseSuggestions: lines
      .filter((l) => l.netToPurchase > 0)
      .map((l) => ({
        materialCode: l.materialCode,
        materialName: l.materialName,
        quantity: l.netToPurchase,
        unit: l.unit,
        supplier: l.suggestedSupplier,
        consolidatedFromOrders: l.orderBreakdown.length,
      })),
  }
}
