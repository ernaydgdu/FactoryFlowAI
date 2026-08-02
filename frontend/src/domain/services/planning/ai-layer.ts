import type {
  CapacityAllocation,
  ConsolidatedMrp,
  PlanningSnapshot,
  RiskExplanation,
  SupplierSimulationResult,
  WorkshopCapacitySnapshot,
} from '../../types/planning'
import type { SalesOrder } from '../../types'
import { SALES_ORDERS, getSalesOrderById } from '../../data/orders'
import { allocateCapacity, getWorkshopCapacitySnapshots } from './capacity-engine'
import { calculateProfit } from './cost-engine'
import { consolidateMrp, getMaterialRequirementByCode } from './mrp-engine'
import { assessOrderRisk } from './risk-engine'
import { calculateTerminPlan } from './termin-engine'
import { runPlanningEngine } from '../planning-engine'

const REFERENCE_DATE = new Date('2026-08-02')

/**
 * AI Hazırlık Katmanı — tüm engine'lerin tek veri modeli üzerinden
 * AI'ın tüketebileceği servisler. Henüz AI yok; sadece veri hazırlığı.
 */
export function explainRisk(orderId: string): RiskExplanation | null {
  const order = getSalesOrderById(orderId)
  if (!order) return null

  const output = runPlanningEngine([order], REFERENCE_DATE)
  const risk = output.riskAssessments[0]
  const termin = output.terminPlans[0]
  if (!risk || !termin) return null

  const triggered = risk.factors.filter((f) => f.triggered)
  const recommendations: string[] = []

  if (triggered.some((f) => f.code === 'FABRIC_DELAY')) {
    recommendations.push('Kumaş PO terminini öne çekin veya alternatif tedarikçi değerlendirin')
  }
  if (triggered.some((f) => f.code === 'ACCESSORY_DELAY')) {
    recommendations.push('Aksesuar satın alma talebini acil PO\'ya dönüştürün')
  }
  if (triggered.some((f) => f.code === 'CAPACITY_FULL')) {
    recommendations.push('Siparişi birden fazla atölyeye bölün veya vardiya ekleyin')
  }
  if (triggered.some((f) => f.code === 'EXF_AT_RISK')) {
    recommendations.push(`Darboğaz aşama: ${termin.bottleneckStage ?? 'EXF'} — önceliklendirme gerekli`)
  }
  if (recommendations.length === 0) {
    recommendations.push('Mevcut plan EXF\'ye yetişebilir — rutin takip yeterli')
  }

  const narrative = [
    `${order.orderNo} risk puanı ${risk.score}/100 (${risk.level}).`,
    risk.summary,
    triggered.length > 0
      ? `Aktif ${triggered.length} risk faktörü: ${triggered.map((f) => f.detail).join('; ')}.`
      : 'Aktif risk faktörü yok.',
  ].join(' ')

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    score: risk.score,
    level: risk.level,
    narrative,
    triggeredFactors: triggered,
    recommendations,
  }
}

export function calculateCapacity(
  quantity: number,
  orderId?: string,
  orderNo?: string,
): CapacityAllocation {
  return allocateCapacity(quantity, undefined, orderId, orderNo)
}

export function calculateMaterialRequirement(
  orders: SalesOrder[] = SALES_ORDERS,
): ConsolidatedMrp {
  return consolidateMrp(orders, REFERENCE_DATE)
}

export function calculateMaterialRequirementForCode(
  materialCode: string,
  orders: SalesOrder[] = SALES_ORDERS,
): { line: ReturnType<typeof getMaterialRequirementByCode>; purchaseQty: number } | null {
  const mrp = consolidateMrp(orders, REFERENCE_DATE)
  const line = getMaterialRequirementByCode(mrp, materialCode)
  if (!line) return null
  return { line, purchaseQty: line.netToPurchase }
}

export function calculateProfitForOrder(orderId: string) {
  const order = getSalesOrderById(orderId)
  if (!order) return null
  return calculateProfit(order)
}

export function simulateSupplierChange(
  orderId: string,
  leadTimeDeltaDays: number,
): SupplierSimulationResult | null {
  const order = getSalesOrderById(orderId)
  if (!order) return null

  const fabricLine = order.mrp.lines.find((l) => l.category === 'Kumaş')
  const originalLead = fabricLine?.leadTimeDays ?? 14
  const newLead = Math.max(1, originalLead + leadTimeDeltaDays)

  const originalTermin = calculateTerminPlan(order, REFERENCE_DATE)
  const originalRisk = assessOrderRisk(
    order,
    originalTermin,
    getWorkshopCapacitySnapshots(),
  )

  const simulatedOrder: SalesOrder = {
    ...order,
    mrp: {
      ...order.mrp,
      lines: order.mrp.lines.map((l) =>
        l.category === 'Kumaş' ? { ...l, leadTimeDays: newLead } : l,
      ),
    },
  }

  const newTermin = calculateTerminPlan(simulatedOrder, REFERENCE_DATE)
  const newRisk = assessOrderRisk(simulatedOrder, newTermin, getWorkshopCapacitySnapshots())

  const originalFeasible = originalTermin.totalSlackDays >= 0
  const newFeasible = newTermin.totalSlackDays >= 0

  const impactSummary = leadTimeDeltaDays < 0
    ? `Tedarikçi değişikliği lead time ${Math.abs(leadTimeDeltaDays)} gün kısalttı. Risk ${originalRisk.score} → ${newRisk.score}.`
    : `Lead time ${leadTimeDeltaDays} gün uzadı. Risk ${originalRisk.score} → ${newRisk.score}. EXF ${newFeasible ? 'yetişir' : 'yetişmez'}.`

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    originalLeadTimeDays: originalLead,
    newLeadTimeDays: newLead,
    originalRiskScore: originalRisk.score,
    newRiskScore: newRisk.score,
    originalExfFeasible: originalFeasible,
    newExfFeasible: newFeasible,
    impactSummary,
  }
}

export function getPlanningSnapshot(orderId: string): PlanningSnapshot | null {
  const order = getSalesOrderById(orderId)
  if (!order) return null

  const output = runPlanningEngine([order], REFERENCE_DATE)
  return output.snapshots[0] ?? null
}

export function getAllPlanningSnapshots(orders: SalesOrder[] = SALES_ORDERS): PlanningSnapshot[] {
  return runPlanningEngine(orders, REFERENCE_DATE).snapshots
}

export function getWorkshopUtilization(): WorkshopCapacitySnapshot[] {
  return getWorkshopCapacitySnapshots()
}

/** AI context — tek JSON-benzeri model */
export function buildAiPlanningContext(orderId: string) {
  const snapshot = getPlanningSnapshot(orderId)
  if (!snapshot) return null

  return {
    order: { id: snapshot.orderId, no: snapshot.orderNo, qty: snapshot.quantity, exf: snapshot.exfDate },
    termin: {
      riskLevel: snapshot.termin.riskLevel,
      slackDays: snapshot.termin.totalSlackDays,
      bottleneck: snapshot.termin.bottleneckStage,
      milestones: snapshot.termin.milestones.map((m) => ({
        stage: m.stage,
        date: m.plannedDate,
        status: m.status,
      })),
    },
    risk: {
      score: snapshot.risk.score,
      level: snapshot.risk.level,
      factors: snapshot.risk.factors.filter((f) => f.triggered).map((f) => f.label),
    },
    cost: {
      fob: snapshot.cost.fob,
      cm: snapshot.cost.cm,
      profitMargin: snapshot.cost.profitMargin,
      totalCost: snapshot.cost.totalCost,
    },
    capacity: snapshot.capacity,
  }
}
