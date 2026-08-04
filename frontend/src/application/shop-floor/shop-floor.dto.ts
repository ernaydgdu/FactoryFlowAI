import type { StatusBadgeDto } from '@/application/core/types'

export type ShopFloorContextOptionDto = {
  productionOrderNo: string
  productCode: string
  lineId: string
  workshopCode: string
  plannedQty: number
  contextStatus: string
}

export type ShopFloorOperationDto = {
  operationCode: string
  operationName: string
  sequence: number
  status: StatusBadgeDto
  rawStatus: string
  plannedQty: number
  completedQty: number
  progressPercent: number
  requiredGate: string | null
  gatePassed: boolean
}

export type ShopFloorSessionDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  lineId: string
  machineId: string
  operatorId: string
  shiftCode: string
  status: StatusBadgeDto
  rawStatus: string
  startedAt: string
  plannedQty: number
  completedQty: number
  downtimeMinutes: number
}

export type MachineStatusDto = {
  machineId: string
  machineName: string
  machineType: string
  lineCode: string
  status: StatusBadgeDto
  rawStatus: string
  activeProductionOrderNo: string
  activeOperationCode: string
  activeOperatorId: string
  completedQtyToday: number
  downtimeMinutes: number
}

export type LaborTrackingDto = {
  operatorId: string
  operatorName: string
  department: string
  status: StatusBadgeDto
  activeProductionOrderNo: string
  activeOperationCode: string
  activeMachineId: string
  sessionCount: number
  totalCompletedQty: number
  totalReworkQty: number
  totalRejectQty: number
  totalDowntimeMinutes: number
}

export type OperationProgressRowDto = {
  id: string
  productionOrderNo: string
  productCode: string
  operationCode: string
  operationName: string
  sequence: number
  status: StatusBadgeDto
  plannedQty: number
  completedQty: number
  progressPercent: number
  gateLabel: string
}

export type WorkstationViewDto = {
  machine: MachineStatusDto | null
  sessions: ShopFloorSessionDto[]
}

export type OptionDto = { value: string; label: string }

export type BundleRowDto = {
  id: string
  bundleNo: string
  productionOrderNo: string
  status: string
  currentOperationCode: string
  workshopCode: string
  pieceCount: number
}

export type TimelineItemDto = {
  id: string
  occurredAt: string
  eventType: string
  title: string
  description: string
  actor: string
}
