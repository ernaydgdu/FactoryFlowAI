/**
 * Sprint 7.3 — PostgreSQL transaction context skeleton.
 * Real begin/commit/rollback binds here when pg driver is wired.
 */
import { PostgresAdapterNotReadyError } from './postgres-not-implemented.error'

export type PostgresTransactionContext = {
  id: string
  depth: number
}

let activeContext: PostgresTransactionContext | null = null

export function getPostgresTransactionContext(): PostgresTransactionContext | null {
  return activeContext
}

export function postgresBeginTransaction(): never {
  throw new PostgresAdapterNotReadyError('postgres-transaction-context.begin')
}

export function postgresCommitTransaction(): never {
  throw new PostgresAdapterNotReadyError('postgres-transaction-context.commit')
}

export function postgresRollbackTransaction(): never {
  throw new PostgresAdapterNotReadyError('postgres-transaction-context.rollback')
}

export function resetPostgresTransactionContextForTests(): void {
  activeContext = null
}
