import type { KpiDto } from '@/application/core/types'
import type { StatusBadgeDto } from '@/application/core/types'

export type ExecutionDashboardKpiDto = KpiDto

export type ExecutionContextListItemDto = {
  productionOrderNo: string
  salesOrderNo: string
  productCode: string
  workshopCode: string
  lineId: string | null
  plannedQty: number
  bundleCount: number
  status: StatusBadgeDto
  initializedAt: string
}

export type ExecutionDashboardViewModel = {
  kpis: ExecutionDashboardKpiDto[]
  activeContexts: ExecutionContextListItemDto[]
  topWipOperation: string
  topWipQty: number
}
