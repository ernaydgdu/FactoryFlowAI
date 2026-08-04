import type { StatusBadgeDto } from '@/application/core/types'
import type { ProductionOrderLifecycleStatus } from '@/domain/production-order/lifecycle-types'

import type { ProductionOrderLifecycleListItemDto } from './production-order-lifecycle.dto'

export type StatusBoardColumnDto = {
  status: ProductionOrderLifecycleStatus
  badge: StatusBadgeDto
  count: number
  totalRemainingQty: number
  items: ProductionOrderLifecycleListItemDto[]
}

export type StatusBoardDto = {
  kpis: { label: string; value: string; hint: string }[]
  columns: StatusBoardColumnDto[]
}

export type OperationListRowDto = {
  id: string
  productionOrderNo: string
  productName: string
  lifecycleStatus: ProductionOrderLifecycleStatus
  sequence: number
  operationCode: string
  operationName: string
  workshopCode: string
  stepStatus: StatusBadgeDto
}

export type MaterialReservationLineDto = {
  stockCardId: string
  code: string
  name: string
  unit: string
  warehouseCode: string
  requiredQty: number
  reservedQty: number
  availableQty: number
  status: StatusBadgeDto
  message: string
}

export type MaterialReservationViewDto = {
  productionOrderNo: string
  reservationApplied: boolean
  lines: MaterialReservationLineDto[]
  fullyReserved: boolean
}

export type ReserveMaterialsResultDto = {
  productionOrderNo: string
  reservedCount: number
  skippedCount: number
}

export type SplitPlanDto = {
  productionOrderNo: string
  splittableQty: number
  lines: { proposedNo: string; quantity: number }[]
  valid: boolean
  errors: string[]
}

export type MergePlanDto = {
  orderNos: string[]
  productCode: string | null
  lineCode: string | null
  totalQty: number
  proposedNo: string | null
  valid: boolean
  errors: string[]
}
