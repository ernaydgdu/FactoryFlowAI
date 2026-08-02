import type { WipPosition, WipTransfer } from '@/domain/execution-platform/execution-types'
import { getOperationExecutions } from '@/domain/execution-platform/operation-execution-service'
import { getWipSummaryForOrder } from '@/domain/execution-platform/execution-platform-service'
import {
  getGlobalWipDensity,
  getWipPositions,
  getWipTransfers,
} from '@/domain/execution-platform/wip-query-service'

import { mapWipStateBadge } from '../shared/presentation.mapper'
import type {
  WipDensityItemDto,
  WipMonitoringViewModel,
  WipPositionItemDto,
  WipTransferItemDto,
} from './wip-monitoring.dto'

function mapPosition(p: WipPosition): WipPositionItemDto {
  return {
    id: p.id,
    productionOrderNo: p.productionOrderNo,
    operationCode: p.operationCode,
    bundleId: p.bundleId,
    workshopCode: p.workshopCode,
    lineId: p.lineId,
    machineId: p.machineId,
    operatorId: p.operatorId,
    shiftCode: p.shiftCode,
    quantity: p.quantity,
    state: mapWipStateBadge(p.state),
    startedAt: p.startedAt,
    waitingSince: p.waitingSince,
    lastTransferId: p.lastTransferId,
    waitingReasonCode: p.waitingReasonCode,
    currentLocationCode: p.currentLocationCode,
    currentQueuePosition: p.currentQueuePosition,
    estimatedReleaseTime: p.estimatedReleaseTime,
    updatedAt: p.updatedAt,
  }
}

function mapTransfer(t: WipTransfer): WipTransferItemDto {
  return {
    id: t.id,
    bundleId: t.bundleId,
    fromOperationCode: t.fromOperationCode,
    toOperationCode: t.toOperationCode,
    quantity: t.quantity,
    transferType: t.transferType,
    transferredAt: t.transferredAt,
    transferredBy: t.transferredBy,
    reasonCode: t.reasonCode,
  }
}

export function queryWipMonitoring(productionOrderNo: string): WipMonitoringViewModel {
  const ops = getOperationExecutions(productionOrderNo)
  const names = new Map(ops.map((o) => [o.operationCode, o.operationName]))
  const summary = getWipSummaryForOrder(productionOrderNo)
  const byOperation: WipDensityItemDto[] = summary.byOperation.map((d) => ({
    operationCode: d.operationCode,
    operationName: names.get(d.operationCode) ?? d.operationName,
    queuedQty: d.queuedQty,
    inProcessQty: d.inProcessQty,
    waitingQcQty: d.waitingQcQty,
    blockedQty: d.blockedQty,
    totalQty: d.totalQty,
    bundleCount: d.bundleCount,
    oldestWaitMinutes: d.oldestWaitMinutes,
  }))
  return {
    productionOrderNo,
    positions: getWipPositions(productionOrderNo).map(mapPosition),
    summary: {
      totalWipQty: summary.totalWipQty,
      bottleneckOperationCode: summary.bottleneckOperationCode,
      averageWaitMinutes: summary.averageWaitMinutes,
      byOperation,
    },
  }
}

export function queryWipPositions(productionOrderNo: string): WipPositionItemDto[] {
  return getWipPositions(productionOrderNo).map(mapPosition)
}

export function queryWipTransfers(productionOrderNo: string): WipTransferItemDto[] {
  return getWipTransfers(productionOrderNo).map(mapTransfer)
}

export function queryGlobalWipDensity(): WipDensityItemDto[] {
  return getGlobalWipDensity().map((d) => ({
    operationCode: d.operationCode,
    operationName: d.operationName,
    queuedQty: d.queuedQty,
    inProcessQty: d.inProcessQty,
    waitingQcQty: d.waitingQcQty,
    blockedQty: d.blockedQty,
    totalQty: d.totalQty,
    bundleCount: d.bundleCount,
    oldestWaitMinutes: d.oldestWaitMinutes,
  }))
}
