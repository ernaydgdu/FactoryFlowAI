import type { ExecutionRole } from '@/domain/execution-platform/execution-types'

export type DailyProductionEntryItemDto = {
  id: string
  productionOrderNo: string
  operationCode: string
  lineId: string
  operatorId: string
  machineId: string
  shiftCode: string
  bundleId: string | null
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  downtimeMinutes: number
  posted: boolean
  recordedBy: string
  recordedAt: string
}

export type DailyProductionEntryViewModel = {
  productionOrderNo: string
  entries: DailyProductionEntryItemDto[]
}

export type PostDailyEntryCommand = {
  actor: string
  role: ExecutionRole
  productionOrderNo: string
  operationCode: string
  lineId: string
  operatorId: string
  machineId: string
  shiftCode: string
  bundleId?: string | null
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  downtimeMinutes: number
  reasonCode?: string | null
}
