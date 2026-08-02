import type { StatusBadgeDto } from '@/application/core/types'
import type { BundleComponentCode, ExecutionRole } from '@/domain/execution-platform/execution-types'

export type BundleListItemDto = {
  id: string
  bundleNo: string
  barcode: string
  productionOrderNo: string
  colorCode: string
  colorName: string
  sizeCode: string
  componentCode: BundleComponentCode
  pieceCount: number
  status: StatusBadgeDto
  currentOperationCode: string | null
  currentLineId: string | null
  createdAt: string
}

export type BundleDetailDto = BundleListItemDto & {
  assemblyGroupId: string
  cuttingBatchRef: string | null
  fabricLotRef: string | null
  labeledAt: string | null
  issuedAt: string | null
  completedAt: string | null
  tickets: BundleTicketDto[]
}

export type BundleTicketDto = {
  id: string
  ticketVersion: number
  printedAt: string | null
  printedBy: string | null
  voided: boolean
}

export type BundleManagementViewModel = {
  productionOrderNo: string
  bundles: BundleListItemDto[]
  totalPieces: number
  waitTimes: BundleWaitTimeDto[]
}

export type BundleWaitTimeDto = {
  bundleId: string
  bundleNo: string
  operationCode: string
  waitMinutes: number
}

export type BundleActorCommand = {
  actor: string
  role: ExecutionRole
}

export type MoveBundleCommand = BundleActorCommand & {
  bundleId: string
  toOperationCode: string
  workshopCode: string
  lineId?: string | null
}

export type HoldBundleCommand = BundleActorCommand & {
  bundleId: string
  reasonCode: string
}

export type CancelBundleCommand = HoldBundleCommand

export type ReworkBundleCommand = BundleActorCommand & {
  bundleId: string
  toOperationCode: string
  reasonCode: string
}

export type SplitBundleCommand = BundleActorCommand & {
  bundleId: string
  splits: Array<{ pieceCount: number; componentCode?: BundleComponentCode }>
}

export type MergeBundlesCommand = BundleActorCommand & {
  bundleIds: string[]
}

export type ReportBundleLostCommand = HoldBundleCommand

export type ReportBundleDamagedCommand = BundleActorCommand & {
  bundleId: string
  severity: 'Minor' | 'Major' | 'Total'
  reasonCode: string
}

export type RollbackBundleCommand = BundleActorCommand & {
  bundleId: string
  eventId: string
}

export type CreateBundlesCommand = BundleActorCommand & {
  executionContextId: string
  productionOrderNo: string
  salesOrderId: string
  salesOrderNo: string
  productCode: string
  workshopCode: string
}

export type ScanBundleQuery = {
  barcode: string
}
