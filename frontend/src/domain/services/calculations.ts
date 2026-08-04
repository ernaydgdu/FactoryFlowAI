import type {
  BomLine,
  ColorSizeMatrix,
  ConsumptionLine,
  MatrixTotals,
  MrpLine,
  ProductColor,
  SalesOrder,
} from '../types'
import type { StockCard } from '../types'
import { queryStockCardById } from '../stock-card/stock-card-query.service'

export function calcActualConsumption(
  consumption: number,
  wastePercent: number,
): number {
  return Math.round(consumption * (1 + wastePercent / 100) * 10000) / 10000
}

export function enrichBomLine(line: BomLine): BomLine {
  return {
    ...line,
    actualConsumption: calcActualConsumption(line.consumption, line.wastePercent),
  }
}

export function computeMatrixTotals(
  colors: ProductColor[],
  sizes: string[],
  matrix: ColorSizeMatrix,
): MatrixTotals {
  const active = colors.filter((c) => c.active)
  const byColor: Record<string, number> = {}
  const bySize: Record<string, number> = {}
  let grandTotal = 0

  for (const color of active) {
    let ct = 0
    for (const size of sizes) {
      const q = matrix[color.id]?.[size] ?? 0
      ct += q
      bySize[size] = (bySize[size] ?? 0) + q
    }
    byColor[color.id] = ct
    grandTotal += ct
  }
  return { byColor, bySize, grandTotal }
}

export function generateMrp(
  _orderId: string,
  _orderNo: string,
  orderQty: number,
  bom: BomLine[],
): { lines: MrpLine[]; generatedAt: string } {
  const lines: MrpLine[] = []

  for (const line of bom) {
    const card = queryStockCardById(line.stockCardId)
    if (!card || line.consumption <= 0) continue

    const actual = calcActualConsumption(line.consumption, line.wastePercent)
    const grossRequired = Math.round(line.consumption * orderQty * 100) / 100
    const netRequired = Math.round(actual * orderQty * 100) / 100

    lines.push({
      id: `mrp-${line.id}`,
      stockCardId: card.id,
      category: card.category,
      code: card.code,
      materialName: card.name,
      warehouse: card.warehouseName,
      unit: card.unit,
      consumptionPerUnit: line.consumption,
      wastePercent: line.wastePercent,
      orderQty,
      grossRequired,
      netRequired,
      supplier: card.supplier,
      leadTimeDays: card.leadTimeDays,
      status: 'Hesaplandı',
    })
  }

  return { lines, generatedAt: new Date().toISOString() }
}

export function calculateConsumptions(
  bom: BomLine[],
  producedQty: number,
  _workshopWarehouse: string,
): ConsumptionLine[] {
  return bom
    .filter((l) => l.stockCardId && l.consumption > 0)
    .map((line) => {
      const card = queryStockCardById(line.stockCardId)!
      const actual = calcActualConsumption(line.consumption, line.wastePercent)
      const totalConsumed = Math.round(actual * producedQty * 100) / 100
      const issued = Math.round(actual * (producedQty + 60) * 100) / 100
      return {
        stockCardId: card.id,
        materialName: card.name,
        unit: card.unit,
        consumptionPerUnit: actual,
        producedQty,
        totalConsumed,
        warehouse: card.warehouseName,
        remainingInWorkshop: Math.max(0, Math.round((issued - totalConsumed) * 100) / 100),
      }
    })
}

export function getOrderDisplayFields(order: SalesOrder) {
  return {
    orderNo: order.orderNo,
    totalQuantity: order.matrixTotals.grandTotal,
    progress: order.progress,
  }
}

export type { StockCard }
