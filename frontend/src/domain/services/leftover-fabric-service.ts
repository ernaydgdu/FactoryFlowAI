/**
 * Leftover Fabric Management — fason depo kalan kumaş analizi ve yeniden kullanım.
 * Gerçek tekstil süreci: kesim artığı / fazla transfer → başka sipariş veya ana depo.
 */
import type { SalesOrder } from '../types'
import type { LeftoverReuseInput, StockLedger } from '../types/stock-ledger'
import { SALES_ORDERS } from '../data/orders'
import { getProductById } from '../data/products'
import { getFabricWarehouseCode } from '../master-data'
import { ruleLeftoverReuse } from './business-rule-engine'
import { calcActualConsumption } from './calculations'

export type LeftoverViability = 'FULL_COVER' | 'PARTIAL_SUPPLEMENT' | 'POOL_RETURN'

export type LeftoverAllocation = {
  orderId: string
  orderNo: string
  stockCardId: string
  allocatedMeters: number
  orderNeedMeters: number
  coveragePercent: number
  viability: LeftoverViability
  fabricStatus: SalesOrder['fabricStatus']
  recommendation: string
}

export type LeftoverAnalysis = {
  remainingMeters: number
  stockCardId: string
  sourceWarehouseCode: string
  candidateCount: number
  allocations: LeftoverAllocation[]
  bestTarget: LeftoverAllocation | null
  poolReturnOption: LeftoverAllocation
  generatedAt: string
}

function getFabricNeedMeters(order: SalesOrder, stockCardId: string): number {
  const product = getProductById(order.productCardId)
  if (!product) return 0
  const bomLine = product.bom.find((b) => b.stockCardId === stockCardId)
  if (!bomLine) return 0
  const mrpLine = order.mrp.lines.find((l) => l.stockCardId === stockCardId)
  if (mrpLine) return mrpLine.netRequired
  return (
    Math.round(
      order.matrixTotals.grandTotal *
        calcActualConsumption(bomLine.consumption, bomLine.wastePercent) *
        100,
    ) / 100
  )
}

export function suggestLeftoverAllocations(
  remainingMeters: number,
  stockCardId: string,
  _sourceWarehouseCode: string,
): LeftoverAllocation[] {
  if (remainingMeters <= 0) return []

  const allocations: LeftoverAllocation[] = []

  const candidates = SALES_ORDERS.filter((o) => {
    const product = getProductById(o.productCardId)
    if (!product?.bom.some((b) => b.stockCardId === stockCardId)) return false
    if (o.productionStatus === 'Sevk Edildi') return false
    return o.fabricStatus === 'Eksik' || o.fabricStatus === 'Kısmi' || o.fabricStatus === 'Bekliyor'
  })

  for (const order of candidates) {
    const need = getFabricNeedMeters(order, stockCardId)
    if (need <= 0) continue

    const allocated = Math.min(remainingMeters, need)
    const coverage = Math.round((allocated / need) * 1000) / 10
    const viability: LeftoverViability =
      allocated >= need ? 'FULL_COVER' : 'PARTIAL_SUPPLEMENT'

    allocations.push({
      orderId: order.id,
      orderNo: order.orderNo,
      stockCardId,
      allocatedMeters: allocated,
      orderNeedMeters: need,
      coveragePercent: coverage,
      viability,
      fabricStatus: order.fabricStatus,
      recommendation:
        viability === 'FULL_COVER'
          ? `${allocated}m ile ${order.orderNo} kumaş ihtiyacı tam karşılanır`
          : `${allocated}m → ${order.orderNo} kısmi destek (%${coverage} kapsama)`,
    })
  }

  allocations.sort((a, b) => {
    if (a.viability === 'FULL_COVER' && b.viability !== 'FULL_COVER') return -1
    if (b.viability === 'FULL_COVER' && a.viability !== 'FULL_COVER') return 1
    return b.coveragePercent - a.coveragePercent
  })

  allocations.push({
    orderId: 'pool',
    orderNo: 'KMS-POOL',
    stockCardId,
    allocatedMeters: remainingMeters,
    orderNeedMeters: remainingMeters,
    coveragePercent: 100,
    viability: 'POOL_RETURN',
    fabricStatus: 'Hazır',
    recommendation: `${remainingMeters}m ana kumaş deposuna (KMS) iade — MRP havuzuna dahil et`,
  })

  return allocations
}

export function analyzeLeftoverFabric(
  remainingMeters: number,
  stockCardId: string,
  sourceWarehouseCode: string,
): LeftoverAnalysis {
  const allocations = suggestLeftoverAllocations(remainingMeters, stockCardId, sourceWarehouseCode)
  const orderAllocations = allocations.filter((a) => a.viability !== 'POOL_RETURN')
  const poolReturn = allocations.find((a) => a.viability === 'POOL_RETURN')!

  return {
    remainingMeters,
    stockCardId,
    sourceWarehouseCode,
    candidateCount: orderAllocations.length,
    allocations,
    bestTarget: orderAllocations[0] ?? null,
    poolReturnOption: poolReturn,
    generatedAt: new Date().toISOString(),
  }
}

export function buildLeftoverReuseInput(
  analysis: LeftoverAnalysis,
  target: LeftoverAllocation,
  sourceOrder: SalesOrder,
  createdBy = 'planner',
): LeftoverReuseInput {
  const toWarehouse =
    target.viability === 'POOL_RETURN'
      ? getFabricWarehouseCode()
      : getFabricWarehouseCode()

  return {
    stockCardId: analysis.stockCardId,
    fromWarehouseCode: analysis.sourceWarehouseCode,
    toWarehouseCode: toWarehouse,
    quantity: target.allocatedMeters,
    sourceOrderId: sourceOrder.id,
    sourceOrderNo: sourceOrder.orderNo,
    targetOrderId: target.orderId,
    targetOrderNo: target.orderNo,
    createdBy,
  }
}

export function executeLeftoverReuseScenario(
  ledger: StockLedger,
  remainingMeters: number,
  stockCardId = 'sc-1',
  sourceWarehouseCode = 'FSN-A',
  sourceOrder = SALES_ORDERS[0],
) {
  const analysis = analyzeLeftoverFabric(remainingMeters, stockCardId, sourceWarehouseCode)
  const target = analysis.bestTarget ?? analysis.poolReturnOption
  const input = buildLeftoverReuseInput(analysis, target, sourceOrder)
  const result = ruleLeftoverReuse(input, ledger)

  return { analysis, target, result, input }
}

export function getLeftoverBrainRecommendations(analysis: LeftoverAnalysis): string[] {
  const recs: string[] = []
  if (analysis.bestTarget) {
    recs.push(analysis.bestTarget.recommendation)
    if (analysis.bestTarget.viability === 'PARTIAL_SUPPLEMENT') {
      recs.push(`${analysis.bestTarget.orderNo} için ek PO veya lot birleştirme değerlendir`)
    }
  }
  recs.push(analysis.poolReturnOption.recommendation)
  if (analysis.candidateCount > 1) {
    recs.push(`${analysis.candidateCount} aday sipariş — leftover havuz optimizasyonu`)
  }
  return recs
}

export function getWorkshopRemaining(
  ledger: StockLedger,
  stockCardId: string,
  warehouseCode: string,
): number {
  const balance = ledger.balances.find(
    (b) => b.stockCardId === stockCardId && b.warehouseCode === warehouseCode,
  )
  return balance?.onHand ?? 0
}
