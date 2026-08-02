import { SALES_ORDERS } from '@/domain/data/orders'
import { getProductById } from '@/domain/data/products'
import { OPERATIONAL_DASHBOARD, SEWING_LINE_RECORDS } from '@/domain/data/workflows'
import {
  employeeRepository,
  machineRepository,
  productionLineRepository,
  workshopRepository,
} from '@/domain/master-data'
import { runPlanningEngine } from '@/domain/services/planning-engine'
import { calculateTerminPlans } from '@/domain/services/planning/termin-engine'
import { buildProductionTracking } from '@/domain/services/textile/production-tracking-service'
import { getOrderTimeline } from '@/domain/platform/services/timeline-service'

import type {
  CapacityLineDto,
  CapacityMachineDto,
  CapacityOperatorDto,
  CapacityWorkshopDto,
  DailyProductionEntryDto,
  LinePlanDto,
  OperationTrackingDto,
  ProductionCalendarDayDto,
  ProductionDashboardDto,
  ProductionOrderDetailDto,
  ProductionScheduleBlockDto,
  ProductionTimelineStepDto,
  WorkshopPlanDto,
} from './production-planning.dto'
import { prodStatusBadge } from './production-planning.dto'

const STAGE_LABELS: Record<string, string> = {
  CUTTING: 'Kesim',
  SEWING: 'Dikim',
  WASHING: 'Yıkama',
  PACKING: 'Paket',
  SHIPPING: 'Sevkiyat',
  QUALITY: 'Kalite',
}

function mapProductionOrder(order: (typeof SALES_ORDERS)[0]): ProductionOrderDetailDto {
  const product = getProductById(order.productCardId)
  const tracking = buildProductionTracking(order)
  const workshop = workshopRepository.getByCode(tracking.operations[0]?.workshopCode ?? 'FSN-A')
  const line = productionLineRepository.getById(tracking.operations[0]?.lineId ?? productionLineRepository.getActive()[0]?.id ?? '')
  const planned = order.production.plannedQty
  const produced = order.production.producedQty
  const terminPlans = calculateTerminPlans([order])
  const termin = terminPlans[0]
  const sewingStart = termin?.milestones.find((m) => m.stage === 'SEWING')?.plannedDate ?? order.exfDate
  const shippingEnd = termin?.milestones.find((m) => m.stage === 'SHIPPING')?.plannedDate ?? order.exfDate

  return {
    id: order.id,
    productionOrderNo: order.production.workOrderNo,
    salesOrderNo: order.orderNo,
    salesOrderId: order.id,
    productCode: product?.productCode ?? '—',
    productName: product?.productName ?? '—',
    customer: product?.customer ?? order.general.customer,
    buyer: product?.buyer ?? '—',
    workshop: workshop?.name ?? '—',
    workshopCode: workshop?.code ?? '—',
    line: line?.name ?? '—',
    lineCode: line?.code ?? '—',
    plannedQty: planned,
    producedQty: produced,
    remainingQty: Math.max(0, planned - produced - order.production.wasteQty),
    reworkQty: order.production.reworkQty,
    rejectQty: Math.floor(order.production.wasteQty * 0.3),
    secondQualityQty: order.production.secondQualityQty,
    fireQty: order.production.wasteQty,
    startDate: sewingStart,
    finishDate: shippingEnd,
    status: prodStatusBadge(order.production.status),
    progress: order.production.progress,
    terminRisk: order.terminRisk,
  }
}

export function mapProductionOrders(): ProductionOrderDetailDto[] {
  return SALES_ORDERS.filter((o) => o.productionStatus !== 'Beklemede').map(mapProductionOrder)
}

export function mapProductionOrderById(id: string): ProductionOrderDetailDto | undefined {
  const order = SALES_ORDERS.find((o) => o.id === id)
  return order ? mapProductionOrder(order) : undefined
}

export function mapProductionCalendar(): ProductionCalendarDayDto[] {
  return OPERATIONAL_DASHBOARD.productionCalendar
}

export function mapProductionSchedule(): ProductionScheduleBlockDto[] {
  const plans = calculateTerminPlans(SALES_ORDERS.filter((o) => o.productionStatus === 'Üretimde' || o.productionStatus === 'Beklemede').slice(0, 15))
  const blocks: ProductionScheduleBlockDto[] = []

  for (const plan of plans) {
    for (const m of plan.milestones) {
      if (!['CUTTING', 'SEWING', 'WASHING', 'PACKING', 'SHIPPING'].includes(m.stage)) continue
      blocks.push({
        id: `${plan.orderId}-${m.stage}`,
        orderId: plan.orderId,
        orderNo: plan.orderNo,
        stage: m.stage,
        label: m.label,
        plannedDate: m.plannedDate,
        startDate: m.plannedDate,
        endDate: m.plannedDate,
        status: prodStatusBadge(m.status),
        draggable: m.status !== 'Completed',
        workshopCode: m.stage === 'SEWING' ? 'FSN-A' : undefined,
        lineCode: m.stage === 'SEWING' ? 'LINE-1' : undefined,
      })
    }
  }
  return blocks
}

export function mapCapacityWorkshops(): CapacityWorkshopDto[] {
  const output = runPlanningEngine(SALES_ORDERS)
  return output.workshopCapacities.map((w) => ({
    code: w.code,
    name: w.name,
    monthlyCapacity: w.monthlyCapacity,
    allocated: w.allocated,
    remaining: w.remaining,
    utilizationPercent: w.utilizationPercent,
    status: prodStatusBadge(w.utilizationPercent >= 95 ? 'Dolu' : w.utilizationPercent >= 80 ? 'Yoğun' : 'Müsait'),
  }))
}

export function mapCapacityLines(): CapacityLineDto[] {
  return productionLineRepository.getActive().map((l) => {
    const ws = workshopRepository.getById(l.workshopId)
    const sewing = SEWING_LINE_RECORDS.filter((s) => s.lineCode === l.code)
    const avgLoad = sewing.length
      ? Math.round(sewing.reduce((sum, s) => sum + (s.producedQty / s.plannedQty) * 100, 0) / sewing.length)
      : Math.round((ws?.currentLoad ?? 0) / Math.max(1, ws?.monthlyCapacity ?? 1) * 100)
    return {
      id: l.id,
      code: l.code,
      name: l.name,
      workshop: ws?.name ?? '—',
      capacityPerDay: l.capacityPerDay,
      loadPercent: avgLoad,
    }
  })
}

export function mapCapacityMachines(): CapacityMachineDto[] {
  return machineRepository.getActive().slice(0, 20).map((m) => {
    const line = productionLineRepository.getById(m.productionLineId)
    return {
      id: m.id,
      code: m.code,
      name: m.name,
      line: line?.name ?? '—',
      machineType: m.machineType,
    }
  })
}

export function mapCapacityOperators(): CapacityOperatorDto[] {
  return employeeRepository.find((e) => e.role === 'Operatör').slice(0, 20).map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    workshop: workshopRepository.getById(e.workshopId ?? '')?.name ?? '—',
  }))
}

export function mapWorkshopPlans(): WorkshopPlanDto[] {
  return workshopRepository.getActive().map((w) => {
    const orders = SALES_ORDERS.filter((o) => {
      const t = buildProductionTracking(o)
      return t.operations[0]?.workshopCode === w.code
    })
    const util = Math.round((w.currentLoad / w.monthlyCapacity) * 100)
    return {
      code: w.code,
      name: w.name,
      location: w.location,
      monthlyCapacity: w.monthlyCapacity,
      currentLoad: w.currentLoad,
      utilizationPercent: util,
      assignedOrders: orders.length,
      freeCapacity: Math.max(0, w.monthlyCapacity - w.currentLoad),
    }
  })
}

export function mapLinePlans(): LinePlanDto[] {
  return productionLineRepository.getActive().map((l) => {
    const ws = workshopRepository.getById(l.workshopId)
    const records = SEWING_LINE_RECORDS.filter((s) => s.lineCode === l.code)
    const avgEff = records.length ? Math.round(records.reduce((s, r) => s + r.efficiency, 0) / records.length) : 0
    const load = records.length
      ? Math.round(records.reduce((s, r) => s + (r.producedQty / r.plannedQty) * 100, 0) / records.length)
      : 0
    return {
      id: l.id,
      code: l.code,
      name: l.name,
      workshop: ws?.name ?? '—',
      capacityPerDay: l.capacityPerDay,
      loadPercent: load,
      activeOrders: [...new Set(records.map((r) => r.orderNo))],
      efficiency: avgEff,
    }
  })
}

export function mapDailyProductionEntries(): DailyProductionEntryDto[] {
  return SEWING_LINE_RECORDS.map((s) => ({
    id: s.id,
    date: s.date,
    lineCode: s.lineCode,
    orderNo: s.orderNo,
    operation: 'Dikim',
    plannedQty: s.plannedQty,
    actualQty: s.producedQty,
    fireQty: s.wasteQty,
    reworkQty: s.reworkQty,
    missingQty: Math.max(0, s.plannedQty - s.producedQty - s.wasteQty),
    secondQualityQty: Math.floor(s.reworkQty * 0.2),
    operator: s.operator,
    shift: s.shift,
    efficiency: s.efficiency,
  }))
}

export function mapOperationTracking(): OperationTrackingDto[] {
  const results: OperationTrackingDto[] = []
  for (const order of SALES_ORDERS.filter((o) => o.productionStatus === 'Üretimde').slice(0, 10)) {
    const tracking = buildProductionTracking(order)
    for (const op of tracking.operations) {
      results.push({
        id: `${order.id}-${op.operationId}`,
        sequence: op.sequence,
        operationCode: op.operationCode,
        operationName: op.operationName,
        orderNo: order.orderNo,
        workshop: op.workshopCode,
        lineCode: op.lineId ?? '—',
        plannedQty: op.plannedQty,
        completedQty: op.completedQty,
        wasteQty: op.wasteQty,
        reworkQty: op.reworkQty,
        progressPercent: op.progressPercent,
        status: prodStatusBadge(op.progressPercent >= 100 ? 'Tamamlandı' : op.progressPercent > 0 ? 'Devam Ediyor' : 'Planlandı'),
      })
    }
  }
  return results
}

export function mapProductionTimeline(orderId?: string): ProductionTimelineStepDto[] {
  const orders = orderId ? SALES_ORDERS.filter((o) => o.id === orderId) : SALES_ORDERS.filter((o) => o.productionStatus === 'Üretimde').slice(0, 5)
  const steps: ProductionTimelineStepDto[] = []
  const flow = ['CUTTING', 'SEWING', 'WASHING', 'QUALITY', 'PACKING', 'SHIPPING']

  for (const order of orders) {
    const termin = calculateTerminPlans([order])[0]
    for (const stage of flow) {
      const milestone = termin?.milestones.find((m) => m.stage === stage)
      const timeline = getOrderTimeline(order.id)
      const event = timeline.find((t) =>
        (stage === 'CUTTING' && t.eventType === 'ProductionStarted') ||
        (stage === 'SHIPPING' && t.eventType === 'ShipmentCompleted') ||
        (stage === 'QUALITY' && t.eventType === 'QualityChecked'),
      )
      steps.push({
        id: `${order.id}-${stage}`,
        stage,
        label: STAGE_LABELS[stage] ?? stage,
        status: prodStatusBadge(milestone?.status ?? (event ? 'Completed' : 'OK')),
        plannedDate: milestone?.plannedDate,
        completedAt: event?.occurredAt,
        orderNo: order.orderNo,
      })
    }
  }
  return steps
}

export function mapProductionDashboard(): ProductionDashboardDto {
  const output = runPlanningEngine(SALES_ORDERS)
  const orders = mapProductionOrders()
  const inProd = orders.filter((o) => o.status.label === 'Devam Ediyor').length
  const delayed = OPERATIONAL_DASHBOARD.terminRisk.length
  const avgEff = SEWING_LINE_RECORDS.length
    ? Math.round(SEWING_LINE_RECORDS.reduce((s, r) => s + r.efficiency, 0) / SEWING_LINE_RECORDS.length)
    : 0
  const totalFire = orders.reduce((s, o) => s + o.fireQty, 0)
  const totalRework = orders.reduce((s, o) => s + o.reworkQty, 0)
  const totalSecond = orders.reduce((s, o) => s + o.secondQualityQty, 0)

  const busy = output.workshopCapacities.filter((w) => w.utilizationPercent >= 80)
  const free = output.workshopCapacities.filter((w) => w.utilizationPercent < 70)

  return {
    kpis: [
      { label: 'Aktif UE', value: String(orders.length), hint: 'Üretim emri' },
      { label: 'Üretimde', value: String(inProd), hint: 'Devam eden' },
      { label: 'Ort. Verim', value: `%${avgEff}`, hint: 'Dikim hatları' },
      { label: 'Termin Riski', value: String(delayed), hint: 'Sipariş' },
    ],
    dailyProduction: OPERATIONAL_DASHBOARD.productionCalendar.map((d) => ({
      label: d.date,
      planned: d.sewing * 400,
      actual: Math.round(d.sewing * 400 * 0.88),
    })),
    capacityByDepartment: OPERATIONAL_DASHBOARD.capacityUsage,
    busyWorkshops: busy.map((w) => ({ name: w.name, load: w.utilizationPercent, efficiency: avgEff })),
    freeCapacityWorkshops: free.map((w) => ({ name: w.name, remaining: w.remaining })),
    delayedOrders: OPERATIONAL_DASHBOARD.terminRisk.map((r) => ({
      orderNo: r.orderNo,
      blocker: r.blocker,
      daysLeft: r.daysLeft,
    })),
    terminRiskOrders: output.riskAssessments.filter((r) => r.level !== 'Düşük').slice(0, 6).map((r) => ({
      orderNo: r.orderNo,
      risk: r.level,
    })),
    wasteSummary: { fire: totalFire, rework: totalRework, secondQuality: totalSecond },
  }
}
