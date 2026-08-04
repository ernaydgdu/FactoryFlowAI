/**
 * Scheduling Engine — Finite / Infinite çizelgeleme.
 *
 * Girdi: kalıcı üretim emirleri (IProductionOrderRepository üzerinden),
 * master-data hat kapasiteleri (ProductionLine.capacityPerDay) ve üretim
 * takvimi. Çıktı: deterministik bir çizelge read-model'i. Çizelge kalıcı
 * bir aggregate DEĞİLDİR; kaynak veriden her seferinde türetilir.
 *
 * INFINITE: emirler istenen tarih aralığına eşit yayılır, kapasite aşımı
 * kabul edilir ve overload olarak işaretlenir.
 * FINITE: hat-gün kovaları kapasiteyle sınırlandırılır; sığmayan miktar
 * sonraki iş gününe kaydırılır (öncelik + termin sırasıyla).
 */
import { productionLineRepository } from '@/domain/master-data'
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'

import { evaluateConstraints } from './constraint-engine.service'
import { buildProductionCalendar } from './production-calendar.service'
import type {
  CalendarDay,
  ScheduleResult,
  ScheduledOrder,
  SchedulingMode,
  WorkCenterLoadBucket,
} from './planning.types'

export const DEFAULT_PLANNING_HORIZON_DAYS = 28
const DEFAULT_LINE_DAILY_CAPACITY = 400

const ACTIVE_STATUSES: ProductionOrderLifecycleRecord['status'][] = [
  'Planned',
  'Approved',
  'Released',
  'In Production',
  'Paused',
]

const PRIORITY_RANK: Record<ProductionOrderLifecycleRecord['priority'], number> = {
  Critical: 0,
  High: 1,
  Normal: 2,
  Low: 3,
}

export function lineDailyCapacity(lineCode: string): number {
  const line = productionLineRepository.getByCode(lineCode)
  return line && line.capacityPerDay > 0 ? line.capacityPerDay : DEFAULT_LINE_DAILY_CAPACITY
}

export function listSchedulableOrders(): ProductionOrderLifecycleRecord[] {
  return queryAllProductionOrders()
    .filter((r) => ACTIVE_STATUSES.includes(r.status))
    .filter((r) => Math.max(0, r.plannedQty - r.producedQty) > 0)
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.plannedFinish.localeCompare(b.plannedFinish) ||
        a.productionOrderNo.localeCompare(b.productionOrderNo),
    )
}

type BucketMap = Map<string, WorkCenterLoadBucket>

function bucketFor(
  buckets: BucketMap,
  record: ProductionOrderLifecycleRecord,
  date: string,
): WorkCenterLoadBucket {
  const key = `${record.productionLineCode}|${date}`
  let bucket = buckets.get(key)
  if (!bucket) {
    const line = productionLineRepository.getByCode(record.productionLineCode)
    bucket = {
      lineCode: record.productionLineCode,
      lineName: record.productionLineName || line?.name || record.productionLineCode,
      workshopId: line?.workshopId ?? record.workshopId,
      date,
      capacityQty: lineDailyCapacity(record.productionLineCode),
      loadQty: 0,
      utilizationPercent: 0,
      overloaded: false,
      orders: [],
    }
    buckets.set(key, bucket)
  }
  return bucket
}

function addToBucket(bucket: WorkCenterLoadBucket, productionOrderNo: string, qty: number): void {
  bucket.loadQty += qty
  bucket.utilizationPercent =
    bucket.capacityQty > 0 ? Math.round((bucket.loadQty / bucket.capacityQty) * 100) : 0
  bucket.overloaded = bucket.loadQty > bucket.capacityQty
  const existing = bucket.orders.find((o) => o.productionOrderNo === productionOrderNo)
  if (existing) existing.qty += qty
  else bucket.orders.push({ productionOrderNo, qty })
}

function desiredWindow(record: ProductionOrderLifecycleRecord, workingDays: string[]): string[] {
  if (workingDays.length === 0) return []
  const first = workingDays[0]
  const plannedStart = record.snapshots.planning.plannedStart || first
  const start = plannedStart > first ? plannedStart : first
  const finish = record.plannedFinish >= start ? record.plannedFinish : start
  const window = workingDays.filter((d) => d >= start && d <= finish)
  if (window.length > 0) return window
  // İstenen aralık ufuk içinde iş gününe denk gelmiyorsa ilk uygun günü kullan
  const fallback = workingDays.find((d) => d >= start) ?? workingDays[workingDays.length - 1]
  return [fallback]
}

function scheduleInfinite(
  records: ProductionOrderLifecycleRecord[],
  workingDays: string[],
  buckets: BucketMap,
): ScheduledOrder[] {
  return records.map((record) => {
    const remaining = Math.max(0, record.plannedQty - record.producedQty)
    const window = desiredWindow(record, workingDays)
    const perDay = window.length > 0 ? remaining / window.length : 0
    let overloaded = false
    for (const date of window) {
      const bucket = bucketFor(buckets, record, date)
      addToBucket(bucket, record.productionOrderNo, Math.round(perDay * 100) / 100)
      if (bucket.overloaded) overloaded = true
    }
    return toScheduledOrder(record, remaining, window[0] ?? null, window[window.length - 1] ?? null, 0, overloaded)
  })
}

function scheduleFinite(
  records: ProductionOrderLifecycleRecord[],
  workingDays: string[],
  buckets: BucketMap,
): ScheduledOrder[] {
  const remainingCapacity = new Map<string, number>()
  const capacityLeft = (record: ProductionOrderLifecycleRecord, date: string): number => {
    const key = `${record.productionLineCode}|${date}`
    if (!remainingCapacity.has(key)) remainingCapacity.set(key, lineDailyCapacity(record.productionLineCode))
    return remainingCapacity.get(key) ?? 0
  }

  return records.map((record) => {
    let remaining = Math.max(0, record.plannedQty - record.producedQty)
    const totalQty = remaining
    const window = desiredWindow(record, workingDays)
    const startFrom = window[0] ?? workingDays[0]
    const candidateDays = workingDays.filter((d) => d >= startFrom)

    let scheduledStart: string | null = null
    let scheduledFinish: string | null = null
    for (const date of candidateDays) {
      if (remaining <= 0) break
      const free = capacityLeft(record, date)
      if (free <= 0) continue
      const placed = Math.min(free, remaining)
      remainingCapacity.set(`${record.productionLineCode}|${date}`, free - placed)
      addToBucket(bucketFor(buckets, record, date), record.productionOrderNo, placed)
      remaining -= placed
      scheduledStart = scheduledStart ?? date
      scheduledFinish = date
    }

    const shiftedDays =
      scheduledFinish && scheduledFinish > record.plannedFinish
        ? candidateDays.filter((d) => d > record.plannedFinish && d <= scheduledFinish).length
        : 0
    // Ufuk içinde yerleştirilemeyen miktar kaldıysa kapasite yetersiz demektir
    return toScheduledOrder(record, totalQty, scheduledStart, scheduledFinish, shiftedDays, remaining > 0)
  })
}

function toScheduledOrder(
  record: ProductionOrderLifecycleRecord,
  remainingQty: number,
  scheduledStart: string | null,
  scheduledFinish: string | null,
  shiftedDays: number,
  overloaded: boolean,
): ScheduledOrder {
  return {
    productionOrderNo: record.productionOrderNo,
    productCode: record.productCode,
    productName: record.productName,
    lineCode: record.productionLineCode,
    lineName: record.productionLineName,
    workshopCode: record.workshopCode,
    status: record.status,
    priority: record.priority,
    plannedQty: record.plannedQty,
    remainingQty,
    scheduledStart,
    scheduledFinish,
    requestedFinish: record.plannedFinish,
    shiftedDays,
    overloaded,
  }
}

export function runSchedulingEngine(
  mode: SchedulingMode,
  referenceDate?: string,
  horizonDays: number = DEFAULT_PLANNING_HORIZON_DAYS,
): ScheduleResult {
  const refDate = referenceDate ?? new Date().toISOString().slice(0, 10)
  const days: CalendarDay[] = buildProductionCalendar(refDate, horizonDays)
  const workingDays = days.filter((d) => d.isWorkingDay).map((d) => d.date)
  const records = listSchedulableOrders()

  const buckets: BucketMap = new Map()
  const entries =
    mode === 'FINITE'
      ? scheduleFinite(records, workingDays, buckets)
      : scheduleInfinite(records, workingDays, buckets)

  const bucketList = [...buckets.values()].sort(
    (a, b) => a.lineCode.localeCompare(b.lineCode) || a.date.localeCompare(b.date),
  )
  const violations = evaluateConstraints({ entries, buckets: bucketList, records })

  return {
    mode,
    referenceDate: refDate,
    horizonDays,
    days,
    entries,
    buckets: bucketList,
    violations,
  }
}
