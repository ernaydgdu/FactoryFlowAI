import type {
  OrderRiskAssessment,
  OrderRiskLevel,
  RiskFactor,
  TerminPlan,
  WorkshopCapacitySnapshot,
} from '../../types/planning'
import { RISK_FACTOR_WEIGHTS as WEIGHTS } from '../../types/planning'
import type { SalesOrder } from '../../types'
import { QUALITY_INSPECTIONS } from '../../data/workflows'
import { WASHING_LOTS } from '../../data/workflows'

function scoreToLevel(score: number): OrderRiskLevel {
  if (score >= 75) return 'Kritik'
  if (score >= 50) return 'Yüksek'
  if (score >= 25) return 'Orta'
  return 'Düşük'
}

function fabricDelayed(order: SalesOrder): boolean {
  return order.fabricStatus === 'Eksik' || order.fabricStatus === 'Bekliyor'
}

function accessoryDelayed(order: SalesOrder): boolean {
  return order.accessoryStatus === 'Eksik' || order.accessoryStatus === 'Bekliyor'
}

function washingDelayed(orderId: string): boolean {
  const lot = WASHING_LOTS.find((w) => w.orderId === orderId)
  if (!lot) return false
  return lot.status === 'Gönderildi' || lot.status === 'Yıkamada' || lot.status === 'Bekliyor'
}

function qualityRejected(orderId: string): boolean {
  return QUALITY_INSPECTIONS.some(
    (q) => q.orderId === orderId && q.aqlResult === 'Fail',
  )
}

/**
 * Risk Motoru — 0-100 arası risk puanı.
 * Kumaş gecikmesi, aksesuar, kapasite, yıkama, kalite, EXF riski.
 */
export function assessOrderRisk(
  order: SalesOrder,
  terminPlan: TerminPlan,
  capacitySnapshots: WorkshopCapacitySnapshot[],
): OrderRiskAssessment {
  const factors: RiskFactor[] = []

  const fabricTrigger = fabricDelayed(order)
  factors.push({
    code: 'FABRIC_DELAY',
    label: 'Kumaş gecikti',
    weight: WEIGHTS.FABRIC_DELAY,
    triggered: fabricTrigger,
    contribution: fabricTrigger ? WEIGHTS.FABRIC_DELAY : 0,
    detail: fabricTrigger
      ? `Kumaş durumu: ${order.fabricStatus}`
      : 'Kumaş hazır',
  })

  const accessoryTrigger = accessoryDelayed(order)
  factors.push({
    code: 'ACCESSORY_DELAY',
    label: 'Aksesuar gecikti',
    weight: WEIGHTS.ACCESSORY_DELAY,
    triggered: accessoryTrigger,
    contribution: accessoryTrigger ? WEIGHTS.ACCESSORY_DELAY : 0,
    detail: accessoryTrigger
      ? `Aksesuar durumu: ${order.accessoryStatus}`
      : 'Aksesuar hazır',
  })

  const capacityTrigger = capacitySnapshots.every((s) => s.utilizationPercent >= 90)
  factors.push({
    code: 'CAPACITY_FULL',
    label: 'Kapasite dolu',
    weight: WEIGHTS.CAPACITY_FULL,
    triggered: capacityTrigger,
    contribution: capacityTrigger ? WEIGHTS.CAPACITY_FULL : 0,
    detail: capacityTrigger
      ? 'Tüm atölyeler %90+ dolu'
      : 'Kapasite müsait',
  })

  const washTrigger = washingDelayed(order.id)
  factors.push({
    code: 'WASHING_DELAY',
    label: 'Yıkama gecikti',
    weight: WEIGHTS.WASHING_DELAY,
    triggered: washTrigger,
    contribution: washTrigger ? WEIGHTS.WASHING_DELAY : 0,
    detail: washTrigger ? 'Yıkama süreci tamamlanmadı' : 'Yıkama OK veya yok',
  })

  const qualityTrigger = qualityRejected(order.id)
  factors.push({
    code: 'QUALITY_REJECT',
    label: 'Kalite reddetti',
    weight: WEIGHTS.QUALITY_REJECT,
    triggered: qualityTrigger,
    contribution: qualityTrigger ? WEIGHTS.QUALITY_REJECT : 0,
    detail: qualityTrigger ? 'AQL Fail kaydı var' : 'Kalite OK',
  })

  const exfTrigger =
    terminPlan.totalSlackDays <= 3 ||
    terminPlan.riskLevel === 'Kritik' ||
    terminPlan.riskLevel === 'Yüksek'
  factors.push({
    code: 'EXF_AT_RISK',
    label: 'EXF riske girdi',
    weight: WEIGHTS.EXF_AT_RISK,
    triggered: exfTrigger,
    contribution: exfTrigger ? WEIGHTS.EXF_AT_RISK : 0,
    detail: exfTrigger
      ? `Termin slack: ${terminPlan.totalSlackDays} gün, darboğaz: ${terminPlan.bottleneckStage ?? '—'}`
      : 'EXF güvenli aralıkta',
  })

  const rawScore = factors.reduce((s, f) => s + f.contribution, 0)
  const score = Math.min(100, rawScore)
  const level = scoreToLevel(score)

  const triggeredLabels = factors.filter((f) => f.triggered).map((f) => f.label)
  const summary =
    triggeredLabels.length === 0
      ? 'Risk düşük — üretim planı EXF\'ye yetişebilir'
      : `Risk faktörleri: ${triggeredLabels.join(', ')}`

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    score,
    level,
    factors,
    exfAtRisk: exfTrigger,
    summary,
  }
}

/** Aksesuar gecikme senaryosu — ACCESSORY_DELAY faktörünü zorunlu tetikler */
export function assessOrderRiskWithAccessoryDelay(
  order: SalesOrder,
  terminPlan: TerminPlan,
  capacitySnapshots: WorkshopCapacitySnapshot[],
  delayDays: number,
): OrderRiskAssessment {
  const base = assessOrderRisk(order, terminPlan, capacitySnapshots)
  const extraDelay = delayDays >= 4 ? 10 : delayDays >= 2 ? 5 : 0
  const score = Math.min(100, base.score + extraDelay)

  const factors = base.factors.map((f) =>
    f.code === 'ACCESSORY_DELAY'
      ? {
          ...f,
          triggered: true,
          contribution: WEIGHTS.ACCESSORY_DELAY,
          detail: `Aksesuar ${delayDays} gün gecikti — ${order.accessoryStatus}`,
        }
      : f,
  )

  const triggeredLabels = factors.filter((f) => f.triggered).map((f) => f.label)
  return {
    ...base,
    score,
    level: scoreToLevel(score),
    factors,
    exfAtRisk: terminPlan.totalSlackDays <= 7 || delayDays >= 3,
    summary:
      triggeredLabels.length === 0
        ? `Aksesuar gecikmesi (+${delayDays} gün)`
        : `Aksesuar gecikmesi (+${delayDays} gün): ${triggeredLabels.join(', ')}`,
  }
}

export function assessAllOrderRisks(
  orders: SalesOrder[],
  terminPlans: TerminPlan[],
  capacitySnapshots: WorkshopCapacitySnapshot[],
): OrderRiskAssessment[] {
  return orders.map((order) => {
    const termin = terminPlans.find((t) => t.orderId === order.id)!
    return assessOrderRisk(order, termin, capacitySnapshots)
  })
}

export function getHighRiskOrders(assessments: OrderRiskAssessment[]): OrderRiskAssessment[] {
  return assessments
    .filter((a) => a.level === 'Yüksek' || a.level === 'Kritik')
    .sort((a, b) => b.score - a.score)
}
