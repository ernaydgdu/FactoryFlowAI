import type { OrderCostBreakdown } from '../types/workflows'
import type { SalesOrder } from '../types'
import { getProductById } from '../data/products'

export function calculateOrderCost(order: SalesOrder): OrderCostBreakdown {
  const qty = order.matrixTotals.grandTotal
  const product = getProductById(order.productCardId)
  const fabricLine = order.mrp.lines.find((l) => l.category === 'Kumaş')
  const fabricCost = fabricLine ? fabricLine.netRequired * 4.2 : qty * 1.55 * 4.2
  const accessoryCost = order.mrp.lines
    .filter((l) => l.category !== 'Kumaş')
    .reduce((s, l) => s + l.netRequired * 0.05, 0)
  const labor = qty * 2.8
  const embroidery = product?.embroidery !== 'Yok' ? qty * 0.45 : 0
  const printCost = product?.print !== 'Yok' ? qty * 0.35 : 0
  const washing = product?.wash !== 'Yok' && product?.wash !== 'Raw' ? qty * 0.55 : 0
  const waste = order.production.wasteQty * 3.2
  const logistics = qty * 0.22
  const overhead = qty * 0.85
  const cm = qty * 4.2
  const totalCost = fabricCost + accessoryCost + labor + embroidery + printCost + washing + waste + logistics + overhead
  const fob = totalCost + cm
  const sellingPrice = fob * 1.22
  const profit = sellingPrice - fob

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    fabric: Math.round(fabricCost),
    accessory: Math.round(accessoryCost),
    labor: Math.round(labor),
    embroidery: Math.round(embroidery),
    print: Math.round(printCost),
    washing: Math.round(washing),
    waste: Math.round(waste),
    logistics: Math.round(logistics),
    overhead: Math.round(overhead),
    cm: Math.round(cm),
    fob: Math.round(fob),
    totalCost: Math.round(totalCost),
    sellingPrice: Math.round(sellingPrice),
    profit: Math.round(profit),
    profitMargin: Math.round((profit / sellingPrice) * 1000) / 10,
  }
}
