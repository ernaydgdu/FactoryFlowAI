/**
 * Production Planning — scheduling, capacity & constraint domain types.
 * Schedule is a deterministic read-model derived from persisted production
 * orders + master-data capacities + the production calendar. No new
 * aggregate is persisted for it (Phase 4 Module 2 scope).
 */
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'

export type SchedulingMode = 'FINITE' | 'INFINITE'

export type CalendarDay = {
  /** ISO date (YYYY-MM-DD) */
  date: string
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  isWorkingDay: boolean
  /** ISO week label, e.g. 2026-W32 */
  weekLabel: string
}

export type WorkCenterLoadBucket = {
  lineCode: string
  lineName: string
  workshopId: string
  date: string
  capacityQty: number
  loadQty: number
  utilizationPercent: number
  overloaded: boolean
  orders: { productionOrderNo: string; qty: number }[]
}

export type ScheduledOrder = {
  productionOrderNo: string
  productCode: string
  productName: string
  lineCode: string
  lineName: string
  workshopCode: string
  status: ProductionOrderLifecycleRecord['status']
  priority: ProductionOrderLifecycleRecord['priority']
  plannedQty: number
  remainingQty: number
  scheduledStart: string | null
  scheduledFinish: string | null
  /** Termin — istenen bitiş (plannedFinish) */
  requestedFinish: string
  /** FINITE modda kapasite nedeniyle kayan iş günü sayısı */
  shiftedDays: number
  overloaded: boolean
}

export type ConstraintViolationType =
  | 'CAPACITY_OVERLOAD'
  | 'TERMIN_RISK'
  | 'PRECEDENCE'
  | 'MATERIAL_SHORTAGE'

export type ConstraintViolation = {
  id: string
  type: ConstraintViolationType
  severity: 'warning' | 'error'
  productionOrderNo?: string
  lineCode?: string
  date?: string
  message: string
}

export type ScheduleResult = {
  mode: SchedulingMode
  referenceDate: string
  horizonDays: number
  days: CalendarDay[]
  entries: ScheduledOrder[]
  buckets: WorkCenterLoadBucket[]
  violations: ConstraintViolation[]
}

export type ReschedulePlanInput = {
  productionOrderNo: string
  plannedStart: string
  plannedFinish: string
  lineCode?: string
}
