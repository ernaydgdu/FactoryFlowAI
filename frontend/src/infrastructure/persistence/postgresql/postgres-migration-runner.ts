/**
 * Sprint 7.1 — Flyway-compatible migration runner skeleton.
 * Executes no SQL in skeleton phase; validates config + migration directory contract.
 */
import { loadPostgresConfig } from './postgres-config'
import { PostgresAdapterNotReadyError } from './postgres-not-implemented.error'

export type MigrationRunResult = {
  applied: string[]
  skipped: string[]
  pending: string[]
}

export function listPendingMigrations(): MigrationRunResult {
  const { migrationDirectory } = loadPostgresConfig()
  return {
    applied: [],
    skipped: [],
    pending: [`${migrationDirectory}/*.sql (skeleton — not executed)`],
  }
}

export function runPendingMigrations(): never {
  listPendingMigrations()
  throw new PostgresAdapterNotReadyError('postgres-migration-runner.run')
}
