import type { KpiDto, StatusBadgeDto, StatusTone } from '../core/types'

export type ProductionOrderDetailDto = {
  id: string
  productionOrderNo: string
  salesOrderNo: string
  salesOrderId: string
  productCode: string
  productName: string
  customer: string
  buyer: string
  workshop: string
  workshopCode: string
  line: string
  lineCode: string
  plannedQty: number
  producedQty: number
  remainingQty: number
  reworkQty: number
  rejectQty: number
  secondQualityQty: number
  fireQty: number
  startDate: string
  finishDate: string
  status: StatusBadgeDto
  progress: number
  terminRisk: boolean
}

export type ProductionCalendarDayDto = {
  date: string
  cutting: number
  sewing: number
  shipping: number
}

export type ProductionScheduleBlockDto = {
  id: string
  orderId: string
  orderNo: string
  stage: string
  label: string
  plannedDate: string
  startDate: string
  endDate: string
  status: StatusBadgeDto
  draggable: boolean
  workshopCode?: string
  lineCode?: string
}

export type CapacityWorkshopDto = {
  code: string
  name: string
  monthlyCapacity: number
  allocated: number
  remaining: number
  utilizationPercent: number
  status: StatusBadgeDto
}

export type CapacityLineDto = {
  id: string
  code: string
  name: string
  workshop: string
  capacityPerDay: number
  loadPercent: number
}

export type CapacityMachineDto = {
  id: string
  code: string
  name: string
  line: string
  machineType: string
}

export type CapacityOperatorDto = {
  id: string
  name: string
  role: string
  workshop: string
}

export type WorkshopPlanDto = {
  code: string
  name: string
  location: string
  monthlyCapacity: number
  currentLoad: number
  utilizationPercent: number
  assignedOrders: number
  freeCapacity: number
}

export type LinePlanDto = {
  id: string
  code: string
  name: string
  workshop: string
  capacityPerDay: number
  loadPercent: number
  activeOrders: string[]
  efficiency: number
}

export type DailyProductionEntryDto = {
  id: string
  date: string
  lineCode: string
  orderNo: string
  operation: string
  plannedQty: number
  actualQty: number
  fireQty: number
  reworkQty: number
  missingQty: number
  secondQualityQty: number
  operator: string
  shift: string
  efficiency: number
}

export type OperationTrackingDto = {
  id: string
  sequence: number
  operationCode: string
  operationName: string
  orderNo: string
  workshop: string
  lineCode: string
  plannedQty: number
  completedQty: number
  wasteQty: number
  reworkQty: number
  progressPercent: number
  status: StatusBadgeDto
}

export type ProductionTimelineStepDto = {
  id: string
  stage: string
  label: string
  status: StatusBadgeDto
  plannedDate?: string
  completedAt?: string
  orderNo: string
}

export type ProductionDashboardDto = {
  kpis: KpiDto[]
  dailyProduction: { label: string; planned: number; actual: number }[]
  capacityByDepartment: { department: string; used: number; total: number }[]
  busyWorkshops: { name: string; load: number; efficiency: number }[]
  freeCapacityWorkshops: { name: string; remaining: number }[]
  delayedOrders: { orderNo: string; blocker: string; daysLeft: number }[]
  terminRiskOrders: { orderNo: string; risk: string }[]
  wasteSummary: { fire: number; rework: number; secondQuality: number }
}

export function prodStatusTone(status: string): StatusTone {
  if (status === 'Tamamlandı' || status === 'Completed' || status === 'OK') return 'success'
  if (status === 'Devam Ediyor' || status === 'At Risk' || status === 'Üretimde') return 'default'
  if (status === 'Late' || status === 'Kritik' || status === 'Duruş') return 'danger'
  if (status === 'Planlandı' || status === 'Beklemede') return 'muted'
  return 'warning'
}

export function prodStatusBadge(label: string): StatusBadgeDto {
  return { label, tone: prodStatusTone(label) }
}
