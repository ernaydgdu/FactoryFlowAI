import type {
  ProductionStage,
  TerminLeadTimes,
  TerminMilestone,
  TerminPlan,
  TerminRiskLevel,
} from '../../types/planning'
import { DEFAULT_TERMIN_LEAD_TIMES } from '../../types/planning'
import type { SalesOrder } from '../../types'
import { getProductById } from '../../data/products'

const REFERENCE_DATE = new Date('2026-08-02')

function parseDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86400000)
}

function milestoneStatus(daysFromToday: number, completed: boolean): TerminMilestone['status'] {
  if (completed) return 'Completed'
  if (daysFromToday < 0) return 'Late'
  if (daysFromToday <= 3) return 'At Risk'
  return 'OK'
}

function riskFromSlack(slackDays: number): TerminRiskLevel {
  if (slackDays < 0) return 'Kritik'
  if (slackDays <= 3) return 'Yüksek'
  if (slackDays <= 7) return 'Orta'
  return 'Düşük'
}

const STAGE_LABELS: Record<ProductionStage, string> = {
  EXF: 'EXF (Ex Factory)',
  FABRIC: 'Kumaş Termin',
  ACCESSORY: 'Aksesuar Termin',
  CUTTING: 'Kesim',
  SEWING: 'Dikim',
  WASHING: 'Yıkama',
  PACKING: 'Paket',
  SHIPPING: 'Sevkiyat',
}

/**
 * Termin Motoru — EXF'den geriye doğru planlama.
 * EXF → Kumaş/Aksesuar → Kesim → Dikim → Yıkama → Paket → Sevkiyat → Bugün → Risk
 */
export function calculateTerminPlan(
  order: SalesOrder,
  today: Date = REFERENCE_DATE,
  leadTimes: TerminLeadTimes = DEFAULT_TERMIN_LEAD_TIMES,
): TerminPlan {
  const product = getProductById(order.productCardId)
  const exf = parseDate(order.general.exf)
  const qty = order.matrixTotals.grandTotal
  const hasWashing = product?.wash !== 'Yok' && product?.wash !== 'Raw'
  const completed = order.productionStatus === 'Tamamlandı' || order.productionStatus === 'Sevk Edildi'

  const sewingDays = Math.max(2, Math.ceil((qty / 1000) * leadTimes.sewingPer1000Units))

  const shippingDate = addDays(exf, -leadTimes.shippingBuffer)
  const packingDate = addDays(shippingDate, -leadTimes.packing)
  const washingDate = hasWashing ? addDays(packingDate, -leadTimes.washing) : packingDate
  const sewingEndDate = addDays(washingDate, -1)
  const sewingStartDate = addDays(sewingEndDate, -sewingDays)
  const cuttingDate = addDays(sewingStartDate, -leadTimes.cutting)
  const accessoryDate = addDays(cuttingDate, -leadTimes.accessoryBuffer)
  const fabricDate = addDays(cuttingDate, -leadTimes.fabricBuffer)

  const fabricMrp = order.mrp.lines.find((l) => l.category === 'Kumaş')
  const accessoryLead = Math.max(
    ...order.mrp.lines.filter((l) => l.category !== 'Kumaş').map((l) => l.leadTimeDays),
    7,
  )
  const fabricLead = fabricMrp?.leadTimeDays ?? 14

  const fabricRequiredBy = addDays(fabricDate, -fabricLead)
  const accessoryRequiredBy = addDays(accessoryDate, -accessoryLead)

  const stageDates: { stage: ProductionStage; date: Date; lead: number }[] = [
    { stage: 'EXF', date: exf, lead: 0 },
    { stage: 'SHIPPING', date: shippingDate, lead: leadTimes.shippingBuffer },
    { stage: 'PACKING', date: packingDate, lead: leadTimes.packing },
  ]

  if (hasWashing) {
    stageDates.push({ stage: 'WASHING', date: washingDate, lead: leadTimes.washing })
  }

  stageDates.push(
    { stage: 'SEWING', date: sewingStartDate, lead: sewingDays },
    { stage: 'CUTTING', date: cuttingDate, lead: leadTimes.cutting },
    { stage: 'ACCESSORY', date: accessoryRequiredBy, lead: accessoryLead },
    { stage: 'FABRIC', date: fabricRequiredBy, lead: fabricLead },
  )

  stageDates.sort((a, b) => b.date.getTime() - a.date.getTime())

  const milestones: TerminMilestone[] = stageDates.map(({ stage, date, lead }) => {
    const daysFromToday = daysBetween(today, date)
    return {
      stage,
      label: STAGE_LABELS[stage],
      plannedDate: formatDate(date),
      daysFromToday,
      status: milestoneStatus(daysFromToday, completed && stage === 'EXF'),
      leadTimeDays: lead,
    }
  })

  const earliest = milestones[milestones.length - 1]
  const totalSlackDays = earliest?.daysFromToday ?? 0

  const bottleneck = milestones.find(
    (m) => m.status === 'Late' || (m.status === 'At Risk' && m.stage !== 'EXF'),
  )

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    exfDate: formatDate(exf),
    today: formatDate(today),
    milestones,
    totalSlackDays,
    bottleneckStage: bottleneck?.stage ?? null,
    riskLevel: riskFromSlack(totalSlackDays),
  }
}

export function calculateTerminPlans(
  orders: SalesOrder[],
  today?: Date,
): TerminPlan[] {
  return orders.map((o) => calculateTerminPlan(o, today))
}

export function getOrdersAtTerminRisk(plans: TerminPlan[]): TerminPlan[] {
  return plans.filter((p) => p.riskLevel === 'Yüksek' || p.riskLevel === 'Kritik')
}
