import type { StatusBadgeDto } from '@/application/core/types'

export type WipPositionItemDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  bundleId: string | null
  workshopCode: string
  lineId: string | null
  machineId: string | null
  operatorId: string | null
  shiftCode: string | null
  quantity: number
  state: StatusBadgeDto
  startedAt: string | null
  waitingSince: string | null
  lastTransferId: string | null
  waitingReasonCode: string | null
  currentLocationCode: string | null
  currentQueuePosition: number | null
  estimatedReleaseTime: string | null
  updatedAt: string
}

export type WipDensityItemDto = {
  operationCode: string
  operationName: string
  queuedQty: number
  inProcessQty: number
  waitingQcQty: number
  blockedQty: number
  totalQty: number
  bundleCount: number
  oldestWaitMinutes: number
}

export type WipMonitoringViewModel = {
  productionOrderNo: string
  positions: WipPositionItemDto[]
  summary: {
    totalWipQty: number
    bottleneckOperationCode: string | null
    averageWaitMinutes: number
    byOperation: WipDensityItemDto[]
  }
}

export type WipTransferItemDto = {
  id: string
  bundleId: string
  fromOperationCode: string
  toOperationCode: string
  quantity: number
  transferType: string
  transferredAt: string
  transferredBy: string
  reasonCode: string | null
}
