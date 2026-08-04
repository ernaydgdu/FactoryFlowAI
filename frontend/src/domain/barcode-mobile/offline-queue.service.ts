/**
 * Offline queue — durable client queue (localStorage), bounded.
 * Sync executor is injected by application (transaction + workflow).
 */
import type { OfflineQueueItem, SyncResult, WorkflowKind } from './barcode.types'
import type { ScanResult } from './barcode.types'

const STORAGE_KEY = 'ffai.barcode.offline-queue.v1'
const MAX_QUEUE = 200
const MAX_ATTEMPTS = 5

function readStore(): OfflineQueueItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OfflineQueueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStore(items: OfflineQueueItem[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)))
}

export function enqueueOfflineWorkflow(input: {
  workflow: WorkflowKind
  payload: Record<string, unknown>
  actorUserId: string
  idempotencyKey: string
}): OfflineQueueItem {
  const items = readStore()
  const existing = items.find((i) => i.idempotencyKey === input.idempotencyKey && i.status === 'Pending')
  if (existing) return existing

  if (items.filter((i) => i.status === 'Pending').length >= MAX_QUEUE) {
    throw new Error(`Offline kuyruk dolu (max ${MAX_QUEUE}). Sync edin.`)
  }

  const item: OfflineQueueItem = {
    id: `OFF-${input.idempotencyKey}`,
    workflow: input.workflow,
    payload: input.payload,
    actorUserId: input.actorUserId,
    idempotencyKey: input.idempotencyKey,
    enqueuedAt: new Date().toISOString(),
    status: 'Pending',
    attempts: 0,
  }
  items.push(item)
  writeStore(items)
  return item
}

export function listOfflineQueue(): OfflineQueueItem[] {
  return readStore().slice().reverse()
}

export function syncOfflineQueue(
  executor: (item: OfflineQueueItem) => ScanResult,
): SyncResult {
  const items = readStore()
  let flushed = 0
  let failed = 0
  for (const item of items) {
    if (item.status !== 'Pending') continue
    item.attempts += 1
    try {
      const result = executor(item)
      if (result.ok) {
        item.status = 'Flushed'
        item.lastError = undefined
        flushed += 1
      } else {
        item.lastError = result.message
        if (item.attempts >= MAX_ATTEMPTS) {
          item.status = 'Failed'
          failed += 1
        }
      }
    } catch (e) {
      item.lastError = (e as Error).message
      if (item.attempts >= MAX_ATTEMPTS) {
        item.status = 'Failed'
        failed += 1
      }
    }
  }
  writeStore(items)
  return {
    flushed,
    failed,
    remaining: items.filter((i) => i.status === 'Pending').length,
  }
}

export function flushOfflineQueue(executor: (item: OfflineQueueItem) => ScanResult): SyncResult {
  return syncOfflineQueue(executor)
}
