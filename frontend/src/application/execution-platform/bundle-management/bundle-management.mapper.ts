import type { Bundle, BundleTicket } from '@/domain/execution-platform/execution-types'
import {
  cancelBundle,
  completeBundle,
  createBundlesFromMatrix,
  getBundle,
  getBundlesForProductionOrder,
  getBundleTickets,
  getBundleWaitTimes,
  holdBundle,
  issueBundleToFloor,
  lookupBundleByScan,
  mergeBundles,
  moveBundleToOperation,
  printBundleTicket,
  reportBundleDamaged,
  reportBundleLost,
  reworkBundle,
  rollbackBundleToEvent,
  splitBundle,
} from '@/domain/execution-platform/bundle-tracking-service'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import { buildCreateBundlesContext } from '@/application/catalog/catalog-command.bridge'
import { mapBundleStatusBadge } from '../shared/presentation.mapper'
import type {
  BundleDetailDto,
  BundleListItemDto,
  BundleManagementViewModel,
  BundleTicketDto,
  CancelBundleCommand,
  CreateBundlesCommand,
  HoldBundleCommand,
  MergeBundlesCommand,
  MoveBundleCommand,
  ReportBundleDamagedCommand,
  ReportBundleLostCommand,
  ReworkBundleCommand,
  RollbackBundleCommand,
  ScanBundleQuery,
  SplitBundleCommand,
} from './bundle-management.dto'
import type { BundleActorCommand } from './bundle-management.dto'

function mapTicket(t: BundleTicket): BundleTicketDto {
  return {
    id: t.id,
    ticketVersion: t.ticketVersion,
    printedAt: t.printedAt,
    printedBy: t.printedBy,
    voided: t.voided,
  }
}

function mapBundleItem(b: Bundle): BundleListItemDto {
  return {
    id: b.id,
    bundleNo: b.bundleNo,
    barcode: b.barcode,
    productionOrderNo: b.productionOrderNo,
    colorCode: b.colorCode,
    colorName: b.colorName,
    sizeCode: b.sizeCode,
    componentCode: b.componentCode,
    pieceCount: b.pieceCount,
    status: mapBundleStatusBadge(b.status),
    currentOperationCode: b.currentOperationCode,
    currentLineId: b.currentLineId,
    createdAt: b.createdAt,
  }
}

function mapBundleDetail(b: Bundle): BundleDetailDto {
  return {
    ...mapBundleItem(b),
    assemblyGroupId: b.assemblyGroupId,
    cuttingBatchRef: b.cuttingBatchRef,
    fabricLotRef: b.fabricLotRef,
    labeledAt: b.labeledAt,
    issuedAt: b.issuedAt,
    completedAt: b.completedAt,
    tickets: getBundleTickets(b.id).map(mapTicket),
  }
}

export function queryBundleManagement(productionOrderNo: string): BundleManagementViewModel {
  const bundles = getBundlesForProductionOrder(productionOrderNo)
  return {
    productionOrderNo,
    bundles: bundles.map(mapBundleItem),
    totalPieces: bundles.reduce((s, b) => s + b.pieceCount, 0),
    waitTimes: getBundleWaitTimes(productionOrderNo),
  }
}

export function queryBundleList(productionOrderNo: string): BundleListItemDto[] {
  return getBundlesForProductionOrder(productionOrderNo).map(mapBundleItem)
}

export function queryBundleDetail(bundleId: string): BundleDetailDto | null {
  const b = getBundle(bundleId)
  return b ? mapBundleDetail(b) : null
}

export function queryBundleByScan(input: ScanBundleQuery): BundleListItemDto | null {
  const b = lookupBundleByScan(input.barcode)
  return b ? mapBundleItem(b) : null
}

function mapBundleResult(b: Bundle): BundleListItemDto {
  return mapBundleItem(b)
}

export function commandCreateBundles(input: CreateBundlesCommand) {
  return runWithExecutionPermission(input, 'Create', 'Bundle', () =>
    createBundlesFromMatrix({
      ...input,
      catalogContext: buildCreateBundlesContext(input.salesOrderId, input.productCode),
    }).map(mapBundleResult),
  )
}

export function commandPrintBundleTicket(input: BundleActorCommand & { bundleId: string }) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () => {
    printBundleTicket(input.bundleId, input.actor)
    return queryBundleDetail(input.bundleId)
  })
}

export function commandIssueBundle(input: BundleActorCommand & { bundleId: string }) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(issueBundleToFloor(input.bundleId, input.actor)),
  )
}

export function commandMoveBundle(input: MoveBundleCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () => {
    const { bundle } = moveBundleToOperation(input)
    return mapBundleResult(bundle)
  })
}

export function commandHoldBundle(input: HoldBundleCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(holdBundle(input.bundleId, input.reasonCode, input.actor)),
  )
}

export function commandCompleteBundle(input: BundleActorCommand & { bundleId: string }) {
  return runWithExecutionPermission(input, 'Close', 'Bundle', () =>
    mapBundleResult(completeBundle(input.bundleId, input.actor)),
  )
}

export function commandCancelBundle(input: CancelBundleCommand) {
  return runWithExecutionPermission(input, 'Cancel', 'Bundle', () =>
    mapBundleResult(cancelBundle(input.bundleId, input.reasonCode, input.actor)),
  )
}

export function commandReworkBundle(input: ReworkBundleCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () => {
    const { bundle } = reworkBundle(input)
    return mapBundleResult(bundle)
  })
}

export function commandSplitBundle(input: SplitBundleCommand) {
  return runWithExecutionPermission(input, 'Split', 'Bundle', () =>
    splitBundle(input).map(mapBundleResult),
  )
}

export function commandMergeBundles(input: MergeBundlesCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(mergeBundles(input)),
  )
}

export function commandReportBundleLost(input: ReportBundleLostCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(reportBundleLost(input.bundleId, input.reasonCode, input.actor)),
  )
}

export function commandReportBundleDamaged(input: ReportBundleDamagedCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(reportBundleDamaged(input)),
  )
}

export function commandRollbackBundle(input: RollbackBundleCommand) {
  return runWithExecutionPermission(input, 'Update', 'Bundle', () =>
    mapBundleResult(rollbackBundleToEvent(input.bundleId, input.eventId, input.actor)),
  )
}
