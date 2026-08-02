import type { ExecutionRole } from '@/domain/execution-platform/execution-types'

export type SplitExecutionItemDto = {
  id: string
  parentProductionOrderNo: string
  childProductionOrderNo: string
  splitIndex: number
  splitOfTotal: number
  workshopCode: string
  plannedQty: number
  br11Applied: boolean
  createdAt: string
  createdBy: string
}

export type SplitProductionViewModel = {
  parentProductionOrderNo: string
  splits: SplitExecutionItemDto[]
}

export type ExecuteSplitProductionCommand = {
  actor: string
  role: ExecutionRole
  parentProductionOrderNo: string
  workshopCodes: string[]
}
