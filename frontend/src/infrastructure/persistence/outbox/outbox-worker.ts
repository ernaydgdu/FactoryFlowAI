import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'

import { OUTBOX_WORKER_BATCH_SIZE } from '../persistence-feature-flags'
import { isTransactionActive } from '../transaction/transaction-state'
import { dispatchOutboxMessage } from './outbox-handlers-loader'

let workerArmed = false

function outboxRepo() {
  return requireUnitOfWork().outbox
}

/** Process pending outbox messages — must run only after TX commit. */
export function processOutboxBatch(tenantId = DEFAULT_TENANT_ID, batchSize = OUTBOX_WORKER_BATCH_SIZE): number {
  if (isTransactionActive()) {
    throw new Error('Outbox worker cannot run inside an active transaction')
  }

  const pending = outboxRepo().claimPending(tenantId, batchSize)
  if (pending.length === 0) return 0

  const publishedIds: string[] = []

  for (const message of pending) {
    try {
      dispatchOutboxMessage(message)
      publishedIds.push(message.id)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      outboxRepo().markFailed(tenantId, message.id, msg)
    }
  }

  if (publishedIds.length > 0) {
    outboxRepo().markPublished(tenantId, publishedIds)
  }

  return publishedIds.length
}

/** Wire outbox worker — armed at bootstrap; flush runs from transaction-runtime post-commit. */
export function ensureOutboxWorkerArmed(): void {
  if (workerArmed) return
  workerArmed = true
}

export function resetOutboxWorkerForTests(): void {
  workerArmed = false
}
