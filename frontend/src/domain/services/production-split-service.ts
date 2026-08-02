/**
 * Split Production Order — tek siparişi çok atölyeye böler.
 * Gerçek tekstil süreci: kapasite darboğazında UE bölme + atölye bazlı malzeme transferi.
 */
import type { BomLine, ProductionOrderSplit, SalesOrder } from '../types'
import type { SplitProductionInput, SplitProductionLine } from '../types/stock-ledger'
import type { CapacityAllocation } from '../types/planning'
import { getWorkshopByCode } from '../master-data'
import { calcActualConsumption } from './calculations'
import { allocateCapacitySplit } from './planning/capacity-engine'
import {
  ruleOrderCreatedMRPAndPR,
  ruleProductionOrderSplit,
  rulePurchaseOrderReceipt,
} from './business-rule-engine'
import { createEmptyLedger } from './stock-ledger'
import { getFabricWarehouseCode } from '../master-data'
import { addTimelineEntry } from '../platform/services/timeline-service'

export const SPLIT_WORKSHOP_CODES = ['FSN-A', 'FSN-B', 'FSN-C'] as const

export function distributeSplitQuantities(totalQty: number, splitCount: number): number[] {
  const base = Math.floor(totalQty / splitCount)
  const remainder = totalQty % splitCount
  return Array.from({ length: splitCount }, (_, i) => base + (i < remainder ? 1 : 0))
}

export function buildSplitProductionOrders(
  order: SalesOrder,
  workshopCodes: readonly string[] = SPLIT_WORKSHOP_CODES,
): ProductionOrderSplit[] {
  const quantities = distributeSplitQuantities(order.matrixTotals.grandTotal, workshopCodes.length)
  return workshopCodes.map((code, i) => {
    const ws = getWorkshopByCode(code)!
    return {
      id: `split-${order.id}-${i + 1}`,
      workOrderNo: `${order.production.workOrderNo}-${String.fromCharCode(65 + i)}`,
      parentOrderId: order.id,
      parentOrderNo: order.orderNo,
      workshopCode: code,
      workshopName: ws.name,
      splitIndex: i + 1,
      splitOfTotal: workshopCodes.length,
      plannedQty: quantities[i],
      producedQty: 0,
      wasteQty: 0,
      reworkQty: 0,
      progress: 0,
      bomReserved: false,
      status: 'Planlandı',
    }
  })
}

export function planSplitCapacity(
  order: SalesOrder,
  workshopCodes: readonly string[] = SPLIT_WORKSHOP_CODES,
): CapacityAllocation {
  return allocateCapacitySplit(
    order.matrixTotals.grandTotal,
    [...workshopCodes],
    order.id,
    order.orderNo,
  )
}

export function getSplitFabricMeters(
  plannedQty: number,
  consumption: number,
  wastePercent: number,
): number {
  return Math.round(plannedQty * calcActualConsumption(consumption, wastePercent) * 100) / 100
}

export function buildSplitProductionInput(
  order: SalesOrder,
  splits: ProductionOrderSplit[],
  bom: BomLine[],
  createdBy = 'planner',
): SplitProductionInput {
  const fabricLine = bom.find((b) => b.stockCardId === 'sc-1') ?? bom[0]
  const splitLines: SplitProductionLine[] = splits.map((s) => ({
    splitIndex: s.splitIndex,
    splitId: s.id,
    workOrderNo: s.workOrderNo,
    workshopCode: s.workshopCode,
    plannedQty: s.plannedQty,
    fabricMeters: getSplitFabricMeters(s.plannedQty, fabricLine.consumption, fabricLine.wastePercent),
  }))

  return {
    parentOrderId: order.id,
    parentOrderNo: order.orderNo,
    parentWorkOrderNo: order.production.workOrderNo,
    stockCardId: fabricLine.stockCardId,
    fabricWarehouseCode: getFabricWarehouseCode(),
    splits: splitLines,
    createdBy,
  }
}

export function seedSplitTimeline(order: SalesOrder, splits: ProductionOrderSplit[]): void {
  for (const split of splits) {
    addTimelineEntry({
      orderId: order.id,
      orderNo: order.orderNo,
      eventType: 'ProductionSplit',
      description: `${split.workshopName}: ${split.plannedQty} adet (${split.splitIndex}/${split.splitOfTotal}) — ${split.workOrderNo}`,
      actor: order.planner,
      metadata: {
        workshopCode: split.workshopCode,
        splitIndex: split.splitIndex,
        workOrderNo: split.workOrderNo,
      },
    })
  }
}

export function applySplitToOrder(order: SalesOrder): SalesOrder {
  const splits = buildSplitProductionOrders(order)
  seedSplitTimeline(order, splits)
  return { ...order, isSplit: true, productionSplits: splits }
}

/** Demo: tam split akışı — MRP → receipt → BR-11 split transfer */
export function executeSplitProductionScenario(
  order: SalesOrder,
  bom: BomLine[],
  ledger = createEmptyLedger(),
) {
  const splits = order.productionSplits ?? buildSplitProductionOrders(order)
  const totalFabric = splits.reduce((s, sp) => {
    const fabricLine = bom.find((b) => b.stockCardId === 'sc-1') ?? bom[0]
    return s + getSplitFabricMeters(sp.plannedQty, fabricLine.consumption, fabricLine.wastePercent)
  }, 0)

  const br01 = ruleOrderCreatedMRPAndPR(order, bom, ledger)
  const br02 = rulePurchaseOrderReceipt(
    {
      poId: `po-split-${order.id}`,
      poNo: `PO-SPLIT-${order.orderNo}`,
      stockCardId: 'sc-1',
      quantity: Math.ceil(totalFabric),
      warehouseCode: getFabricWarehouseCode(),
      createdBy: 'buyer',
    },
    ledger,
  )

  const splitInput = buildSplitProductionInput(order, splits, bom)
  const br11 = ruleProductionOrderSplit(splitInput, ledger)

  return {
    ledger,
    splits,
    splitCapacity: planSplitCapacity(order),
    results: [br01, br02, br11],
    success: br11.success,
  }
}

export function countSplitProductionNodes(order: SalesOrder): number {
  return order.productionSplits?.length ?? 0
}

export function getSplitBrainRecommendations(order: SalesOrder): string[] {
  if (!order.isSplit || !order.productionSplits?.length) return []
  return [
    'Birleşik timeline — tüm child UE milestone\'larını izle',
    'Split sevkiyat — tüm atölyeler tamamlanınca birleşik SHIPMENT',
    ...order.productionSplits.map(
      (s) => `${s.workshopName} (${s.plannedQty} adet) kapasite takibi`,
    ),
  ]
}

export function validateSplitIntegrity(order: SalesOrder): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!order.isSplit || !order.productionSplits?.length) {
    errors.push('Split model tanımlı değil')
    return { valid: false, errors }
  }
  const sum = order.productionSplits.reduce((s, sp) => s + sp.plannedQty, 0)
  if (sum !== order.matrixTotals.grandTotal) {
    errors.push(`Split adet toplamı (${sum}) sipariş adedine (${order.matrixTotals.grandTotal}) eşit değil`)
  }
  if (order.productionSplits.length < 2) {
    errors.push('En az 2 split UE gerekli')
  }
  return { valid: errors.length === 0, errors }
}
