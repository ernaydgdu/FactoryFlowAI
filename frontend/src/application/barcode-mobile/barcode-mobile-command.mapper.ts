/**
 * Application scan / workflow commands.
 * Mutations require execution.write (TD-P0-03); decode-only scans remain read-side.
 */
import { assertCommandPermission } from '@/application/core/command-permission'
import {
  enqueueOfflineWorkflow,
  listOfflineQueue,
  syncOfflineQueue,
} from '@/domain/barcode-mobile/offline-queue.service'
import {
  executeScanBundle as domainScanBundle,
  executeScanFinishedGoods as domainScanFg,
  executeScanMaterial as domainScanMaterial,
  executeScanOperation as domainScanOperation,
  executeScanProduction as domainScanProduction,
} from '@/domain/barcode-mobile/scan.service'
import {
  BarcodeMobileDomainError,
  runWorkflow,
} from '@/domain/barcode-mobile/scan-workflow.service'
import {
  buildBundleLabel,
  buildFinishedGoodsLabel,
  buildPalletLabel,
} from '@/domain/barcode-mobile/label.service'
import type { ScanResult } from '@/domain/barcode-mobile/barcode.types'

import { runBarcodeMobileWriteCommand } from './barcode-mobile-permission.guard'
import type { ScanCommand, SyncResultDto, WorkflowScanCommand } from './barcode-mobile.dto'

export { BarcodeMobileDomainError }

export function executeScanOperation(command: ScanCommand): ScanResult {
  return domainScanOperation(command.raw)
}

export function executeScanBundle(command: ScanCommand): ScanResult {
  return domainScanBundle(command.raw)
}

export function executeScanMaterial(command: ScanCommand): ScanResult {
  return domainScanMaterial(command.raw)
}

export function executeScanFinishedGoods(command: ScanCommand): ScanResult {
  return domainScanFg(command.raw)
}

export function executeScanProduction(command: ScanCommand): ScanResult {
  return domainScanProduction(command.raw)
}

function payloadFromCommand(command: WorkflowScanCommand): Record<string, unknown> {
  return {
    raw: command.raw,
    quantity: command.quantity,
    produced: command.produced,
    purchaseOrderId: command.purchaseOrderId,
    warehouseCode: command.warehouseCode,
    productionOrderNo: command.productionOrderNo,
    lot: command.lot,
    lineId: command.lineId,
    machineId: command.machineId,
    shiftCode: command.shiftCode,
    shipmentRef: command.shipmentRef,
  }
}

export function executeWorkflowScan(command: WorkflowScanCommand): ScanResult {
  if (command.offline) {
    assertCommandPermission('execution.write')
    enqueueOfflineWorkflow({
      workflow: command.workflow,
      payload: payloadFromCommand(command),
      actorUserId: command.actorUserId,
      idempotencyKey: command.idempotencyKey,
    })
    return {
      kind: command.workflow,
      raw: command.raw,
      symbology: 'UNKNOWN',
      ok: true,
      message: `Offline kuyruğa alındı (${command.workflow})`,
    }
  }
  return runBarcodeMobileWriteCommand(() =>
    runWorkflow(command.workflow, payloadFromCommand(command), command.actorUserId, command.idempotencyKey),
  )
}

export function executeReceivingScan(command: WorkflowScanCommand): ScanResult {
  return executeWorkflowScan({ ...command, workflow: 'RECEIVING' })
}

export function executeMaterialIssueScan(command: WorkflowScanCommand): ScanResult {
  return executeWorkflowScan({ ...command, workflow: 'MATERIAL_ISSUE' })
}

export function executeProductionScan(command: WorkflowScanCommand): ScanResult {
  return executeWorkflowScan({ ...command, workflow: 'PRODUCTION' })
}

export function executeFgReceiptScan(command: WorkflowScanCommand): ScanResult {
  return executeWorkflowScan({ ...command, workflow: 'FG_RECEIPT' })
}

export function executeShipmentScan(command: WorkflowScanCommand): ScanResult {
  return executeWorkflowScan({ ...command, workflow: 'SHIPMENT' })
}

export function executeSyncOfflineQueue(): SyncResultDto {
  assertCommandPermission('execution.write')
  return syncOfflineQueue((item) =>
    runBarcodeMobileWriteCommand(() =>
      runWorkflow(item.workflow, item.payload, item.actorUserId, item.idempotencyKey),
    ),
  )
}

export function executeFlushOfflineQueue(): SyncResultDto {
  return executeSyncOfflineQueue()
}

export function queryOfflineQueue() {
  return listOfflineQueue()
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
