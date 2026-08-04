/**
 * MRP variant explosion — color × size × BOM per sales order.
 */
import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { getSizeSetSizes } from '@/domain/data/size-sets'
import { toLegacyProductColors } from '@/domain/services/textile/color-management-service'
import { toLegacyBomLines } from '@/domain/services/textile/bom-service'
import { calcActualConsumption } from '@/domain/services/calculations'
import type { SalesOrder } from '@/domain/types'

import type { MrpException, MrpProductConsolidation, MrpVariantDemand } from './mrp.types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type VariantExplosionResult = {
  variantDemands: MrpVariantDemand[]
  exceptions: MrpException[]
}

export function explodeOrderVariantDemands(order: SalesOrder): VariantExplosionResult {
  const exceptions: MrpException[] = []
  const variantDemands: MrpVariantDemand[] = []

  const pc = queryProductCardById(order.productCardId)
  if (!pc) {
    exceptions.push({
      code: 'MISSING_PRODUCT_CARD',
      message: `${order.orderNo}: Ürün kartı bulunamadı (${order.productCardId})`,
      entityRef: order.productCardId,
      severity: 'critical',
    })
    return { variantDemands, exceptions }
  }

  const bom = toLegacyBomLines(pc.bom)
  if (bom.length === 0) {
    exceptions.push({
      code: 'MISSING_BOM',
      message: `${order.orderNo}: Onaylı ürün kartında BOM tanımı yok`,
      entityRef: pc.productCode,
      severity: 'critical',
    })
    return { variantDemands, exceptions }
  }

  const colors = toLegacyProductColors(pc.colorAssignments).filter((c) => c.active)
  const sizes = getSizeSetSizes(pc.refs.sizeSetId)

  for (const color of colors) {
    for (const size of sizes) {
      const orderQty = order.matrix[color.id]?.[size] ?? 0
      if (orderQty <= 0) continue

      for (const bomLine of bom) {
        if (!bomLine.stockCardId || bomLine.consumption <= 0) continue
        const actual = calcActualConsumption(bomLine.consumption, bomLine.wastePercent)
        const grossRequired = round2(bomLine.consumption * orderQty)
        const netRequired = round2(actual * orderQty)
        const variantKey = `${color.id}:${size}`

        variantDemands.push({
          orderId: order.id,
          orderNo: order.orderNo,
          productCardId: pc.id,
          productCode: pc.productCode,
          colorId: color.id,
          colorName: color.name,
          size,
          variantKey,
          orderQty,
          stockCardId: bomLine.stockCardId,
          materialCode: bomLine.stockCardId,
          grossRequired,
          netRequired,
        })
      }
    }
  }

  return { variantDemands, exceptions }
}

export function consolidateProductDemands(
  orders: SalesOrder[],
): { consolidations: MrpProductConsolidation[]; exceptions: MrpException[] } {
  const map = new Map<string, MrpProductConsolidation>()
  const exceptions: MrpException[] = []

  for (const order of orders) {
    const pc = queryProductCardById(order.productCardId)
    if (!pc) {
      exceptions.push({
        code: 'MISSING_PRODUCT_CARD',
        message: `${order.orderNo}: Ürün kartı eksik`,
        entityRef: order.productCardId,
        severity: 'critical',
      })
      continue
    }

    const qty = order.matrixTotals.grandTotal
    const existing = map.get(order.productCardId)
    if (existing) {
      existing.totalQuantity = round2(existing.totalQuantity + qty)
      existing.orderCount += 1
      existing.orders.push({ orderId: order.id, orderNo: order.orderNo, quantity: qty })
    } else {
      map.set(order.productCardId, {
        productCardId: pc.id,
        productCode: pc.productCode,
        productName: pc.productName,
        totalQuantity: qty,
        orderCount: 1,
        orders: [{ orderId: order.id, orderNo: order.orderNo, quantity: qty }],
      })
    }
  }

  const consolidations = Array.from(map.values())
    .filter((c) => c.orderCount > 1)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)

  return { consolidations, exceptions }
}
