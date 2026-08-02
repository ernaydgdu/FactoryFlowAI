import { requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'

import {
  createPersistenceSnapshot,
  restorePersistenceSnapshot,
  type PersistenceSnapshot,
} from './persistence-snapshot'
import {
  decrementTransactionDepth,
  getTransactionDepth,
  incrementTransactionDepth,
  resetTransactionStateForTests,
} from './transaction-state'

type PostCommitCallback = () => void

let persistenceSnapshot: PersistenceSnapshot | null = null
const postCommitQueue: PostCommitCallback[] = []
let outboxFlushFn: (() => void) | null = null

export { isTransactionActive } from './transaction-state'

/** Registered by bootstrap-runtime after UoW is available. */
export function registerOutboxFlush(fn: () => void): void {
  outboxFlushFn = fn
}

export function resetOutboxFlushForTests(): void {
  outboxFlushFn = null
}

/** Register callback to run after successful commit. Runs immediately when no TX is active. */
export function registerPostCommit(callback: PostCommitCallback): void {
  if (getTransactionDepth() > 0) {
    postCommitQueue.push(callback)
  } else {
    callback()
  }
}

function flushPostCommitQueue(): void {
  const queue = [...postCommitQueue]
  postCommitQueue.length = 0
  for (const callback of queue) {
    callback()
  }
  flushOutboxWorker()
}

function flushOutboxWorker(): void {
  outboxFlushFn?.()
}

function clearPostCommitQueue(): void {
  postCommitQueue.length = 0
}

/**
 * Constitution command flow: begin → domain writes → commit → post-commit (outbox worker).
 * InMemory adapter validates TX semantics via full persistence snapshot rollback.
 */
export function runInTransaction<T>(fn: () => T): T {
  const uow = requireUnitOfWork()
  const isRoot = getTransactionDepth() === 0

  if (isRoot) {
    persistenceSnapshot = createPersistenceSnapshot()
  }

  uow.begin()
  incrementTransactionDepth()

  try {
    const result = fn()
    uow.commit()
    decrementTransactionDepth()

    if (getTransactionDepth() === 0) {
      persistenceSnapshot = null
      flushPostCommitQueue()
    }

    return result
  } catch (error) {
    uow.rollback()
    decrementTransactionDepth()

    if (getTransactionDepth() === 0 && persistenceSnapshot) {
      restorePersistenceSnapshot(persistenceSnapshot)
      persistenceSnapshot = null
      clearPostCommitQueue()
    }

    throw error
  }
}

/** @internal test helper */
export function resetTransactionRuntimeForTests(): void {
  resetTransactionStateForTests()
  persistenceSnapshot = null
  clearPostCommitQueue()
}
