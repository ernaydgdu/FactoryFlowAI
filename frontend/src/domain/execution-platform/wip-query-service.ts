/**
 * WIP Query Service — READ aggregation (engine değil, query)
 */
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../ports/persistence/persistence.types'
import type { PersistedWipTransfer } from '../ports/persistence/persistence-aggregates'
import type { WipPosition, WipState, WipTransfer } from './execution-types'

export type WipDensitySnapshot = {
  productionOrderNo: string
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

export type WipSummary = {
  productionOrderNo: string
  totalWipQty: number
  byOperation: WipDensitySnapshot[]
  bottleneckOperationCode: string | null
  averageWaitMinutes: number
}

function wipTransferRepo() {
  return requireUnitOfWork().wipTransfers
}

function wipPositionRepo() {
  return requireUnitOfWork().wipPositions
}

function stripTransferMeta(row: PersistedWipTransfer): WipTransfer {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

export function setWipPositions(positions: WipPosition[]): void {
  wipPositionRepo().setPositions(DEFAULT_TENANT_ID, positions)
}

export function appendWipTransfer(transfer: WipTransfer): void {
  const persisted: PersistedWipTransfer = {
    ...transfer,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'wip_transfer',
    streamId: transfer.productionOrderNo,
    sequence: 0,
  }
  wipTransferRepo().append(DEFAULT_TENANT_ID, { streamType: 'wip_transfer', streamId: transfer.productionOrderNo }, [persisted])
}

export function getWipTransfers(productionOrderNo: string): WipTransfer[] {
  const page = wipTransferRepo().cursorByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo, {
    limit: PERSISTENCE_CURSOR_MAX_LIMIT,
  })
  return page.items.map(stripTransferMeta)
}

export function getWipPositions(productionOrderNo: string): WipPosition[] {
  return wipPositionRepo().getPositions(DEFAULT_TENANT_ID, productionOrderNo)
}

function waitMinutes(since: string | null): number {
  if (!since) return 0
  return Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60_000))
}

export function buildWipSummary(
  productionOrderNo: string,
  operationNames: Map<string, string>,
): WipSummary {
  const positions = getWipPositions(productionOrderNo)
  const byOp = new Map<string, WipDensitySnapshot>()

  for (const pos of positions) {
    const existing = byOp.get(pos.operationCode) ?? {
      productionOrderNo,
      operationCode: pos.operationCode,
      operationName: operationNames.get(pos.operationCode) ?? pos.operationCode,
      queuedQty: 0,
      inProcessQty: 0,
      waitingQcQty: 0,
      blockedQty: 0,
      totalQty: 0,
      bundleCount: 0,
      oldestWaitMinutes: 0,
    }

    existing.totalQty += pos.quantity
    if (pos.bundleId) existing.bundleCount += 1

    switch (pos.state as WipState) {
      case 'Queued':
        existing.queuedQty += pos.quantity
        break
      case 'InProcess':
        existing.inProcessQty += pos.quantity
        break
      case 'WaitingQC':
        existing.waitingQcQty += pos.quantity
        break
      case 'Blocked':
        existing.blockedQty += pos.quantity
        break
      default:
        break
    }

    const wm = waitMinutes(pos.waitingSince)
    if (wm > existing.oldestWaitMinutes) existing.oldestWaitMinutes = wm
    byOp.set(pos.operationCode, existing)
  }

  const byOperation = [...byOp.values()].sort((a, b) => b.totalQty - a.totalQty)
  const bottleneck = byOperation[0]?.totalQty > 0 ? byOperation[0] : null
  const totalWipQty = byOperation.reduce((s, o) => s + o.totalQty, 0)
  const averageWaitMinutes =
    byOperation.length > 0
      ? Math.round(byOperation.reduce((s, o) => s + o.oldestWaitMinutes, 0) / byOperation.length)
      : 0

  return {
    productionOrderNo,
    totalWipQty,
    byOperation,
    bottleneckOperationCode: bottleneck?.operationCode ?? null,
    averageWaitMinutes,
  }
}

export function getGlobalWipDensity(): WipDensitySnapshot[] {
  const positions = wipPositionRepo().getAllPositions(DEFAULT_TENANT_ID)
  const grouped = new Map<string, WipDensitySnapshot>()
  for (const pos of positions) {
    const key = `${pos.productionOrderNo}:${pos.operationCode}`
    const existing = grouped.get(key) ?? {
      productionOrderNo: pos.productionOrderNo,
      operationCode: pos.operationCode,
      operationName: pos.operationCode,
      queuedQty: 0,
      inProcessQty: 0,
      waitingQcQty: 0,
      blockedQty: 0,
      totalQty: 0,
      bundleCount: 0,
      oldestWaitMinutes: 0,
    }
    existing.totalQty += pos.quantity
    if (pos.bundleId) existing.bundleCount += 1
    if (pos.state === 'Queued') existing.queuedQty += pos.quantity
    if (pos.state === 'InProcess') existing.inProcessQty += pos.quantity
    grouped.set(key, existing)
  }
  return [...grouped.values()].sort((a, b) => b.totalQty - a.totalQty)
}

export function clearWipStores(): void {
  wipPositionRepo().clearAll(DEFAULT_TENANT_ID)
}
