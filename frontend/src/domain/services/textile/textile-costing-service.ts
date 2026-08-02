/**
 * Textile Costing — kırılımlı maliyet, FOB, CM, karlılık.
 */
import type { SalesOrder } from '../../types'
import type { TextileCostBreakdown } from '../../types/textile-erp'
import { calculateDetailedCost } from '../planning/cost-engine'

const COMMISSION_RATE = 0.03

export function calculateTextileCostBreakdown(order: SalesOrder): TextileCostBreakdown {
  const base = calculateDetailedCost(order)
  const qty = order.matrixTotals.grandTotal
  const packaging = Math.round(qty * 0.15)
  const commission = Math.round(base.fob * COMMISSION_RATE)
  const totalCost = base.totalCost + packaging
  const fob = totalCost + base.cm
  const sellingPrice = base.sellingPrice
  const grossProfit = sellingPrice - fob
  const netProfit = grossProfit - commission
  const baseAmount = fob > 0 ? fob : 1

  const structure = [
    { key: 'fabric', label: 'Kumaş', amount: base.fabric },
    { key: 'accessory', label: 'Aksesuar', amount: base.accessory },
    { key: 'labor', label: 'İşçilik', amount: base.labor },
    { key: 'washing', label: 'Yıkama', amount: base.washing },
    { key: 'embroidery', label: 'Nakış', amount: base.embroidery },
    { key: 'print', label: 'Baskı', amount: base.print },
    { key: 'packaging', label: 'Paketleme', amount: packaging },
    { key: 'logistics', label: 'Lojistik', amount: base.logistics },
    { key: 'commission', label: 'Komisyon', amount: commission },
    { key: 'waste', label: 'Fire', amount: base.waste },
    { key: 'overhead', label: 'Genel Gider', amount: base.overhead },
    { key: 'cm', label: 'CM', amount: base.cm },
  ].map((item) => ({
    ...item,
    percent: Math.round((item.amount / baseAmount) * 1000) / 10,
  }))

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    quantity: qty,
    fabric: base.fabric,
    accessory: base.accessory,
    labor: base.labor,
    washing: base.washing,
    embroidery: base.embroidery,
    print: base.print,
    packaging,
    logistics: base.logistics,
    commission,
    waste: base.waste,
    overhead: base.overhead,
    totalCost,
    cm: base.cm,
    fob,
    sellingPrice,
    grossProfit,
    netProfit,
    grossMarginPercent: Math.round((grossProfit / sellingPrice) * 1000) / 10,
    netMarginPercent: Math.round((netProfit / sellingPrice) * 1000) / 10,
    unitFob: qty > 0 ? Math.round((fob / qty) * 100) / 100 : 0,
    unitCm: qty > 0 ? Math.round((base.cm / qty) * 100) / 100 : 0,
    structure,
  }
}

export function simulateCostWithFabricIncrease(
  order: SalesOrder,
  increasePercent: number,
): TextileCostBreakdown {
  const base = calculateTextileCostBreakdown(order)
  const newFabric = Math.round(base.fabric * (1 + increasePercent / 100))
  const delta = newFabric - base.fabric
  return {
    ...base,
    fabric: newFabric,
    totalCost: base.totalCost + delta,
    fob: base.fob + delta,
    grossProfit: base.grossProfit - delta,
    netProfit: base.netProfit - delta,
    grossMarginPercent: Math.round(((base.grossProfit - delta) / base.sellingPrice) * 1000) / 10,
    netMarginPercent: Math.round(((base.netProfit - delta) / base.sellingPrice) * 1000) / 10,
    structure: base.structure.map((s) =>
      s.key === 'fabric' ? { ...s, amount: newFabric, percent: Math.round((newFabric / base.fob) * 1000) / 10 } : s,
    ),
  }
}
