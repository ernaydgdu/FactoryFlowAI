import { runInTransaction } from '@/infrastructure/persistence/transaction/transaction-runtime'

/** Wrap application commands in a UnitOfWork transaction (constitution §4.1). */
export function runCommandInTransaction<T>(fn: () => T): T {
  return runInTransaction(fn)
}
