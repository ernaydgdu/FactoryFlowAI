import { registerCommandTransactionRunner } from '@/domain/ports/persistence/command-transaction.port'

import { setOutboxImmediateDispatch } from './in-memory/outbox/domain-event-outbox.in-memory.repository'
import { ensureOutboxHandlersLoaded } from './outbox/outbox-handlers-loader'
import { ensureOutboxWorkerArmed, processOutboxBatch } from './outbox/outbox-worker'
import { registerOutboxFlush, runInTransaction } from './transaction/transaction-runtime'

let wired = false
let wiring: Promise<void> | null = null

function flushOutboxLoop(): void {
  let processed = 0
  do {
    processed = processOutboxBatch()
  } while (processed >= 1)
}

/** Wire TX runner + outbox flush — call after UoW registration and seed. */
export function wirePersistenceRuntime(): Promise<void> {
  if (wired) return Promise.resolve()
  if (!wiring) {
    wiring = ensureOutboxHandlersLoaded().then(() => {
      registerCommandTransactionRunner(runInTransaction)
      registerOutboxFlush(flushOutboxLoop)
      ensureOutboxWorkerArmed()
      setOutboxImmediateDispatch(() => flushOutboxLoop())
      wired = true
    })
  }
  return wiring
}

export function resetPersistenceRuntimeWireForTests(): void {
  wired = false
  wiring = null
}
