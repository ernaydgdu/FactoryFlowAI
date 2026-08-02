import type { OrderCostBreakdown } from '../../types/workflows'
import type { SalesOrder } from '../../types'
import { calculateOrderCost } from '../cost-calculator'

export type CostBreakdownDetail = OrderCostBreakdown & {
  unitCost: number
  unitFob: number
  unitCm: number
  costStructure: { label: string; amount: number; percent: number }[]
}

/**
 * Maliyet Motoru — kumaş, aksesuar, işçilik, nakış, baskı, yıkama,
 * lojistik, fire, genel gider, FOB, CM, karlılık.
 */
export function calculateDetailedCost(order: SalesOrder): CostBreakdownDetail {
  const base = calculateOrderCost(order)
  const qty = order.matrixTotals.grandTotal

  const costStructure = [
    { label: 'Kumaş', amount: base.fabric, key: 'fabric' },
    { label: 'Aksesuar', amount: base.accessory, key: 'accessory' },
    { label: 'İşçilik', amount: base.labor, key: 'labor' },
    { label: 'Nakış', amount: base.embroidery, key: 'embroidery' },
    { label: 'Baskı', amount: base.print, key: 'print' },
    { label: 'Yıkama', amount: base.washing, key: 'washing' },
    { label: 'Fire', amount: base.waste, key: 'waste' },
    { label: 'Lojistik', amount: base.logistics, key: 'logistics' },
    { label: 'Genel Gider', amount: base.overhead, key: 'overhead' },
    { label: 'CM', amount: base.cm, key: 'cm' },
  ].map((item) => ({
    label: item.label,
    amount: item.amount,
    percent: base.totalCost + base.cm > 0
      ? Math.round((item.amount / (base.totalCost + base.cm)) * 1000) / 10
      : 0,
  }))

  return {
    ...base,
    unitCost: qty > 0 ? Math.round((base.totalCost / qty) * 100) / 100 : 0,
    unitFob: qty > 0 ? Math.round((base.fob / qty) * 100) / 100 : 0,
    unitCm: qty > 0 ? Math.round((base.cm / qty) * 100) / 100 : 0,
    costStructure,
  }
}

export function calculateProfit(order: SalesOrder): {
  fob: number
  cm: number
  sellingPrice: number
  profit: number
  profitMargin: number
  profitable: boolean
} {
  const cost = calculateOrderCost(order)
  return {
    fob: cost.fob,
    cm: cost.cm,
    sellingPrice: cost.sellingPrice,
    profit: cost.profit,
    profitMargin: cost.profitMargin,
    profitable: cost.profit > 0,
  }
}

export function calculateAllCosts(orders: SalesOrder[]): CostBreakdownDetail[] {
  return orders.map(calculateDetailedCost)
}

export function getAverageProfitMargin(orders: SalesOrder[]): number {
  if (orders.length === 0) return 0
  const total = orders.reduce((s, o) => s + calculateOrderCost(o).profitMargin, 0)
  return Math.round((total / orders.length) * 10) / 10
}
