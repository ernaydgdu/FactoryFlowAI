/**
 * Accessory Delay Flow — YKK fermuar vb. aksesuar gecikmesi → termin/risk etkisi.
 */
import type { SalesOrder } from '../types'
import type { AccessoryDelayInput, StockLedger } from '../types/stock-ledger'
import type { TerminPlan, OrderRiskAssessment } from '../types/planning'
import { SALES_ORDERS } from '../data/orders'
import { getProductById } from '../data/products'
import { STOCK_CARDS } from '../data/stock-cards'
import { ruleAccessoryDelay } from './business-rule-engine'
import { calculateTerminPlan } from './planning/termin-engine'
import { assessOrderRisk, assessOrderRiskWithAccessoryDelay } from './planning/risk-engine'
import { getWorkshopCapacitySnapshots } from './planning/capacity-engine'
import { analyzeMaterialDelayImpact } from '../brain/twin/engines/impact-engine'
import { buildDependencyGraph } from '../brain/twin/engines/dependency-engine'

export type AccessoryDelayImpact = {
  orderId: string
  orderNo: string
  originalSlack: number
  adjustedSlack: number
  originalRisk: OrderRiskAssessment
  adjustedRisk: OrderRiskAssessment
  delayDays: number
}

export function findOrdersUsingAccessory(stockCardId: string): SalesOrder[] {
  return SALES_ORDERS.filter((o) => {
    const product = getProductById(o.productCardId)
    return product?.bom.some((b) => b.stockCardId === stockCardId)
  })
}

export function calculateTerminWithAccessoryDelay(
  order: SalesOrder,
  delayDays: number,
): TerminPlan {
  const base = calculateTerminPlan(order)
  const adjustedMilestones = base.milestones.map((m) => {
    if (m.stage === 'ACCESSORY' || m.stage === 'CUTTING' || m.stage === 'SEWING') {
      const newDays = m.daysFromToday - delayDays
      return {
        ...m,
        daysFromToday: newDays,
        status:
          newDays < 0 ? ('Late' as const) : newDays <= 3 ? ('At Risk' as const) : m.status,
      }
    }
    return m
  })

  const newSlack = base.totalSlackDays - delayDays
  return {
    ...base,
    milestones: adjustedMilestones,
    totalSlackDays: newSlack,
    riskLevel: newSlack < 0 ? 'Kritik' : newSlack <= 3 ? 'Yüksek' : base.riskLevel,
    bottleneckStage: newSlack < 0 ? 'ACCESSORY' : base.bottleneckStage,
  }
}

export function assessAllAccessoryDelayImpacts(
  stockCardId: string,
  delayDays: number,
): AccessoryDelayImpact[] {
  const orders = findOrdersUsingAccessory(stockCardId)
  const snapshots = getWorkshopCapacitySnapshots()

  return orders.map((order) => {
    const originalTermin = calculateTerminPlan(order)
    const adjustedTermin = calculateTerminWithAccessoryDelay(order, delayDays)
    const originalRisk = assessOrderRisk(order, originalTermin, snapshots)
    const adjustedRisk = assessOrderRiskWithAccessoryDelay(
      order,
      adjustedTermin,
      snapshots,
      delayDays,
    )

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      originalSlack: originalTermin.totalSlackDays,
      adjustedSlack: adjustedTermin.totalSlackDays,
      originalRisk,
      adjustedRisk,
      delayDays,
    }
  })
}

export function executeAccessoryDelayScenario(
  stockCardId = 'sc-14',
  delayDays = 4,
  ledger?: StockLedger,
) {
  const card = STOCK_CARDS.find((c) => c.id === stockCardId)
  const input: AccessoryDelayInput = {
    stockCardId,
    stockCardName: card?.name ?? stockCardId,
    supplierName: card?.supplier ?? 'YKK',
    delayDays,
    reportedBy: 'buyer',
  }

  const ruleResult = ruleAccessoryDelay(input, ledger ?? { movements: [], balances: [], lastMovementNo: 0 })
  const impacts = assessAllAccessoryDelayImpacts(stockCardId, delayDays)
  const twinImpact = analyzeMaterialDelayImpact(stockCardId, delayDays)
  const deps = buildDependencyGraph(impacts.slice(0, 10).map((i) => i.orderId))

  return { input, ruleResult, impacts, twinImpact, deps }
}

export function getAccessoryDelayBrainRecommendations(
  stockCardId: string,
  delayDays: number,
  impacts: AccessoryDelayImpact[],
): string[] {
  const card = STOCK_CARDS.find((c) => c.id === stockCardId)
  const recs = [
    `${card?.supplier ?? 'Tedarikçi'} ${card?.name ?? stockCardId} — ${delayDays} gün gecikme`,
    `${impacts.length} sipariş etkilendi — kesim/dikim planı gözden geçir`,
  ]

  const critical = impacts.filter((i) => i.adjustedRisk.level === 'Kritik' || i.adjustedRisk.level === 'Yüksek')
  if (critical.length > 0) {
    recs.push(`${critical.length} sipariş termin riski arttı — alternatif tedarikçi veya hava kargo`)
  }

  const worst = impacts.sort((a, b) => a.adjustedSlack - b.adjustedSlack)[0]
  if (worst) {
    recs.push(`En kritik: ${worst.orderNo} slack ${worst.originalSlack} → ${worst.adjustedSlack} gün`)
  }

  recs.push('Acil PO / alternatif fermuar lotu değerlendir')
  return recs
}
