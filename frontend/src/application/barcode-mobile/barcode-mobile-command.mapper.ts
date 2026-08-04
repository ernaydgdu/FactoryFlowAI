/**
 * Application scan commands — delegates to domain; no new aggregate writes.
 * Offline enqueue/flush is in-memory skeleton (no persistence port).
 */
import {
  executeScanBundle as domainScanBundle,
  executeScanFinishedGoods as domainScanFg,
  executeScanMaterial as domainScanMaterial,
  executeScanOperation as domainScanOperation,
  executeScanProduction as domainScanProduction,
} from '@/domain/barcode-mobile/scan.service'
import {
  enqueueOfflineScan,
  flushOfflineQueue,
} from '@/domain/barcode-mobile/offline-queue.service'
import type { ScanKind, ScanResult } from '@/domain/barcode-mobile/barcode.types'
import {
  buildBundleLabel,
  buildFinishedGoodsLabel,
  buildPalletLabel,
} from '@/domain/barcode-mobile/label.service'

import type { ScanCommand } from './barcode-mobile.dto'

export { BarcodeMobileDomainError } from '@/domain/barcode-mobile/scan.service'

function maybeOffline(kind: ScanKind, command: ScanCommand): ScanResult | null {
  if (!command.offline) return null
  enqueueOfflineScan({ kind, raw: command.raw, actorUserId: command.actorUserId })
  return {
    kind,
    raw: command.raw,
    symbology: 'UNKNOWN',
    ok: true,
    message: `Offline kuyruğa alındı (${kind})`,
  }
}

export function executeScanOperation(command: ScanCommand): ScanResult {
  return maybeOffline('OPERATION', command) ?? domainScanOperation(command.raw)
}

export function executeScanBundle(command: ScanCommand): ScanResult {
  return maybeOffline('BUNDLE', command) ?? domainScanBundle(command.raw)
}

export function executeScanMaterial(command: ScanCommand): ScanResult {
  return maybeOffline('MATERIAL', command) ?? domainScanMaterial(command.raw)
}

export function executeScanFinishedGoods(command: ScanCommand): ScanResult {
  return maybeOffline('FINISHED_GOODS', command) ?? domainScanFg(command.raw)
}

export function executeScanProduction(command: ScanCommand): ScanResult {
  return maybeOffline('OPERATION', command) ?? domainScanProduction(command.raw)
}

export function executeFlushOfflineQueue() {
  return flushOfflineQueue()
}

export function queryBundleLabel(bundleId: string) {
  return buildBundleLabel(bundleId)
}

export function queryPalletLabel(input: {
  warehouseCode: string
  palletSeq: string
  productionOrderNo?: string
}) {
  return buildPalletLabel(input)
}

export function queryFinishedGoodsLabel(productionOrderNo: string) {
  return buildFinishedGoodsLabel(productionOrderNo)
}
