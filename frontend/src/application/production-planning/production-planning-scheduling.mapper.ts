/**
 * Production Planning Scheduling — read mapper'lar.
 * Kaynak: persisted üretim emirleri + master-data kapasiteleri üzerinden
 * çalışan scheduling/constraint engine (demo SALES_ORDERS kullanılmaz).
 */
import type { StatusBadgeDto } from '@/application/core/types'
import type {
  ConstraintViolation,
  ScheduleResult,
  SchedulingMode,
} from '@/domain/production-planning/planning.types'
import { runSchedulingEngine } from '@/domain/production-planning/scheduling-engine.service'
import { buildWorkCenterLoad, type LineLoadSummary } from '@/domain/production-planning/work-center-load.service'
import type { ProductionOrderLifecycleStatus } from '@/domain/production-order/lifecycle-types'

import type {
  CapacityViewDto,
  CapacityWorkshopDto,
  ConstraintViolationDto,
  LineLoadItemDto,
  PlanningKpiDto,
  ScheduleBoardDto,
  ScheduleBoardRowDto,
  ScheduledOrderDto,
} from './production-planning-scheduling.dto'

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

function statusBadge(status: ProductionOrderLifecycleStatus): StatusBadgeDto {
  switch (status) {
    case 'In Production':
    case 'Released':
    case 'Approved':
      return { label: status, tone: 'success' }
    case 'Paused':
      return { label: status, tone: 'warning' }
    default:
      return { label: status, tone: 'default' }
  }
}

function loadStatusBadge(utilizationPercent: number, overloadedDays: number): StatusBadgeDto {
  if (overloadedDays > 0) return { label: 'Aşırı Yük', tone: 'danger' }
  if (utilizationPercent >= 85) return { label: 'Dolu', tone: 'warning' }
  if (utilizationPercent > 0) return { label: 'Normal', tone: 'success' }
  return { label: 'Boş', tone: 'default' }
}

function mapViolations(violations: ConstraintViolation[]): ConstraintViolationDto[] {
  return violations.map((v) => ({
    id: v.id,
    type: v.type,
    severity: v.severity,
    productionOrderNo: v.productionOrderNo,
    lineCode: v.lineCode,
    date: v.date,
    message: v.message,
  }))
}

function buildKpis(schedule: ScheduleResult): PlanningKpiDto[] {
  const overloadedBuckets = schedule.buckets.filter((b) => b.overloaded).length
  const errors = schedule.violations.filter((v) => v.severity === 'error').length
  const warnings = schedule.violations.filter((v) => v.severity === 'warning').length
  return [
    { label: 'Planlanan UE', value: String(schedule.entries.length), hint: 'Aktif üretim emri' },
    {
      label: 'Kalan Adet',
      value: String(Math.round(schedule.entries.reduce((s, e) => s + e.remainingQty, 0))),
      hint: `${schedule.horizonDays} günlük ufuk`,
    },
    { label: 'Aşırı Yüklü Gün', value: String(overloadedBuckets), hint: 'Hat-gün kovası' },
    { label: 'Kısıt İhlali', value: `${errors} hata / ${warnings} uyarı`, hint: 'Constraint engine' },
  ]
}

function mapRows(schedule: ScheduleResult, summaries: LineLoadSummary[]): ScheduleBoardRowDto[] {
  return summaries
    .filter((s) => s.buckets.length > 0 || s.capacityPerDay > 0)
    .map((s) => {
      const byDate = new Map(s.buckets.map((b) => [b.date, b]))
      return {
        lineCode: s.lineCode,
        lineName: s.lineName,
        workshopName: s.workshopName,
        capacityPerDay: s.capacityPerDay,
        cells: schedule.days
          .filter((d) => d.isWorkingDay)
          .map((d) => {
            const bucket = byDate.get(d.date)
            return {
              date: d.date,
              loadQty: Math.round((bucket?.loadQty ?? 0) * 100) / 100,
              capacityQty: bucket?.capacityQty ?? s.capacityPerDay,
              utilizationPercent: bucket?.utilizationPercent ?? 0,
              overloaded: bucket?.overloaded ?? false,
              orders: bucket?.orders ?? [],
            }
          }),
      }
    })
}

function mapOrders(schedule: ScheduleResult): ScheduledOrderDto[] {
  return schedule.entries.map((e) => ({
    productionOrderNo: e.productionOrderNo,
    productName: e.productName,
    lineCode: e.lineCode,
    lineName: e.lineName,
    status: statusBadge(e.status),
    priority: e.priority,
    plannedQty: e.plannedQty,
    remainingQty: e.remainingQty,
    scheduledStart: e.scheduledStart,
    scheduledFinish: e.scheduledFinish,
    requestedFinish: e.requestedFinish,
    shiftedDays: e.shiftedDays,
    overloaded: e.overloaded,
  }))
}

export function mapScheduleBoard(mode: SchedulingMode): ScheduleBoardDto {
  const schedule = runSchedulingEngine(mode)
  const summaries = buildWorkCenterLoad(schedule)
  return {
    mode: schedule.mode,
    referenceDate: schedule.referenceDate,
    days: schedule.days
      .filter((d) => d.isWorkingDay)
      .map((d) => ({
        date: d.date,
        dayLabel: `${DAY_LABELS[d.weekday]} ${d.date.slice(8, 10)}.${d.date.slice(5, 7)}`,
        weekLabel: d.weekLabel,
        isWorkingDay: d.isWorkingDay,
      })),
    rows: mapRows(schedule, summaries),
    orders: mapOrders(schedule),
    violations: mapViolations(schedule.violations),
    kpis: buildKpis(schedule),
  }
}

function mapLineSummary(s: LineLoadSummary): LineLoadItemDto {
  return {
    lineCode: s.lineCode,
    lineName: s.lineName,
    workshopName: s.workshopName,
    capacityPerDay: s.capacityPerDay,
    horizonCapacity: s.horizonCapacity,
    totalLoad: s.totalLoad,
    utilizationPercent: s.utilizationPercent,
    overloadedDays: s.overloadedDays,
    activeOrderCount: s.activeOrderNos.length,
    loadStatus: loadStatusBadge(s.utilizationPercent, s.overloadedDays),
  }
}

export function mapLineLoadList(mode: SchedulingMode): LineLoadItemDto[] {
  const schedule = runSchedulingEngine(mode)
  return buildWorkCenterLoad(schedule).map(mapLineSummary)
}

export function mapCapacityView(mode: SchedulingMode): CapacityViewDto {
  const schedule = runSchedulingEngine(mode)
  const summaries = buildWorkCenterLoad(schedule)

  const byWorkshop = new Map<string, LineLoadSummary[]>()
  for (const s of summaries) {
    const key = `${s.workshopCode}|${s.workshopName}`
    const list = byWorkshop.get(key) ?? []
    list.push(s)
    byWorkshop.set(key, list)
  }

  const workshops: CapacityWorkshopDto[] = [...byWorkshop.entries()]
    .map(([key, lines]) => {
      const [workshopCode, workshopName] = key.split('|')
      const horizonCapacity = lines.reduce((s, l) => s + l.horizonCapacity, 0)
      const totalLoad = Math.round(lines.reduce((s, l) => s + l.totalLoad, 0) * 100) / 100
      return {
        workshopCode,
        workshopName,
        lineCount: lines.length,
        horizonCapacity,
        totalLoad,
        utilizationPercent: horizonCapacity > 0 ? Math.round((totalLoad / horizonCapacity) * 100) : 0,
        overloadedDays: lines.reduce((s, l) => s + l.overloadedDays, 0),
      }
    })
    .sort((a, b) => a.workshopCode.localeCompare(b.workshopCode))

  return {
    mode: schedule.mode,
    workshops,
    lines: summaries.map(mapLineSummary),
    violations: mapViolations(schedule.violations),
    kpis: buildKpis(schedule),
  }
}
