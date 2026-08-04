/**
 * Offline Queue iskeleti — tarama olaylarını bellekte tutar.
 * Yeni persistence portu YOK; flush yalnızca in-process.
 */
import type { OfflineQueueItem, ScanKind } from './barcode.types'
import {
  executeScanBundle,
  executeScanFinishedGoods,
  executeScanMaterial,
  executeScanOperation,
} from './scan.service'

const queue: OfflineQueueItem[] = []
let seq = 0

export function enqueueOfflineScan(input: {
  kind: ScanKind
  raw: string
  actorUserId: string
}): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: `OFF-${++seq}`,
    kind: input.kind,
    raw: input.raw,
    actorUserId: input.actorUserId,
    enqueuedAt: new Date().toISOString(),
    status: 'Pending',
  }
  queue.push(item)
  return item
}

export function listOfflineQueue(): OfflineQueueItem[] {
  return queue.slice().reverse()
}

export function flushOfflineQueue(): { flushed: number; failed: number } {
  let flushed = 0
  let failed = 0
  for (const item of queue) {
    if (item.status !== 'Pending') continue
    try {
      const result =
        item.kind === 'BUNDLE'
          ? executeScanBundle(item.raw)
          : item.kind === 'OPERATION'
            ? executeScanOperation(item.raw)
            : item.kind === 'MATERIAL'
              ? executeScanMaterial(item.raw)
              : item.kind === 'FINISHED_GOODS'
                ? executeScanFinishedGoods(item.raw)
                : { ok: false, message: 'Bilinmeyen scan türü' }
      if (result.ok) {
        item.status = 'Flushed'
        flushed += 1
      } else {
        item.status = 'Failed'
        item.lastError = result.message
        failed += 1
      }
    } catch (e) {
      item.status = 'Failed'
      item.lastError = (e as Error).message
      failed += 1
    }
  }
  return { flushed, failed }
}
