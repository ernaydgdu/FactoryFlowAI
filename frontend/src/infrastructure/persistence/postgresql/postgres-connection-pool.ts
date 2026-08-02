/**
 * Sprint 7.1 — connection pool skeleton.
 * Driver wiring (pg / Prisma) lands in Sprint 7.2+; no npm driver in skeleton phase.
 */
import { assertPostgresConfigReady, loadPostgresConfig, type PostgresConfig } from './postgres-config'
import { PostgresAdapterNotReadyError } from './postgres-not-implemented.error'

export type PostgresPoolStatus = 'idle' | 'configured' | 'connected'

let status: PostgresPoolStatus = 'idle'
let activeConfig: PostgresConfig | null = null

export function getPostgresPoolStatus(): PostgresPoolStatus {
  return status
}

/** Validates config and marks pool as configured — does not open a real connection yet. */
export function configurePostgresPool(config: PostgresConfig = loadPostgresConfig()): PostgresConfig {
  assertPostgresConfigReady(config)
  activeConfig = config
  status = 'configured'
  return config
}

/** Placeholder for future pg.Pool acquisition. */
export function acquirePostgresConnection(): never {
  if (!activeConfig) configurePostgresPool()
  throw new PostgresAdapterNotReadyError('postgres-connection-pool.acquire')
}

export function resetPostgresPoolForTests(): void {
  status = 'idle'
  activeConfig = null
}
