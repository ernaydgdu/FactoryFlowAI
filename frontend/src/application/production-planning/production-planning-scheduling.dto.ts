import type { StatusBadgeDto } from '@/application/core/types'
import type { SchedulingMode } from '@/domain/production-planning/planning.types'

export type PlanningKpiDto = {
  label: string
  value: string
  hint: string
}

export type ScheduleDayDto = {
  date: string
  dayLabel: string
  weekLabel: string
  isWorkingDay: boolean
}

export type ScheduleBoardCellDto = {
  date: string
  loadQty: number
  capacityQty: number
  utilizationPercent: number
  overloaded: boolean
  orders: { productionOrderNo: string; qty: number }[]
}

export type ScheduleBoardRowDto = {
  lineCode: string
  lineName: string
  workshopName: string
  capacityPerDay: number
  cells: ScheduleBoardCellDto[]
}

export type ScheduledOrderDto = {
  productionOrderNo: string
  productName: string
  lineCode: string
  lineName: string
  status: StatusBadgeDto
  priority: string
  plannedQty: number
  remainingQty: number
  scheduledStart: string | null
  scheduledFinish: string | null
  requestedFinish: string
  shiftedDays: number
  overloaded: boolean
}

export type ConstraintViolationDto = {
  id: string
  type: string
  severity: 'warning' | 'error'
  productionOrderNo?: string
  lineCode?: string
  date?: string
  message: string
}

export type ScheduleBoardDto = {
  mode: SchedulingMode
  referenceDate: string
  days: ScheduleDayDto[]
  rows: ScheduleBoardRowDto[]
  orders: ScheduledOrderDto[]
  violations: ConstraintViolationDto[]
  kpis: PlanningKpiDto[]
}

export type LineLoadItemDto = {
  lineCode: string
  lineName: string
  workshopName: string
  capacityPerDay: number
  horizonCapacity: number
  totalLoad: number
  utilizationPercent: number
  overloadedDays: number
  activeOrderCount: number
  loadStatus: StatusBadgeDto
}

export type CapacityWorkshopDto = {
  workshopCode: string
  workshopName: string
  lineCount: number
  horizonCapacity: number
  totalLoad: number
  utilizationPercent: number
  overloadedDays: number
}

export type CapacityViewDto = {
  mode: SchedulingMode
  workshops: CapacityWorkshopDto[]
  lines: LineLoadItemDto[]
  violations: ConstraintViolationDto[]
  kpis: PlanningKpiDto[]
}
