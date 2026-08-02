/** Sprint 7.1 — connection + migration configuration (no driver yet). */

export type PostgresConfig = {
  connectionUrl: string
  poolMax: number
  migrationDirectory: string
  schema: string
}

const CONFIG_ENV_KEYS = {
  url: ['VITE_DATABASE_URL', 'DATABASE_URL'] as const,
  poolMax: ['VITE_PG_POOL_MAX', 'PG_POOL_MAX'] as const,
  migrations: ['VITE_PG_MIGRATIONS_DIR', 'PG_MIGRATIONS_DIR'] as const,
  schema: ['VITE_PG_SCHEMA', 'PG_SCHEMA'] as const,
}

function readEnv(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = (import.meta.env as Record<string, string | undefined>)[key]
    if (value) return value
  }
  return undefined
}

export function loadPostgresConfig(): PostgresConfig {
  const connectionUrl = readEnv(CONFIG_ENV_KEYS.url) ?? ''
  const poolMax = Number.parseInt(readEnv(CONFIG_ENV_KEYS.poolMax) ?? '10', 10)
  const migrationDirectory = readEnv(CONFIG_ENV_KEYS.migrations) ?? 'database/migrations'
  const schema = readEnv(CONFIG_ENV_KEYS.schema) ?? 'public'
  return { connectionUrl, poolMax, migrationDirectory, schema }
}

export function assertPostgresConfigReady(config: PostgresConfig = loadPostgresConfig()): void {
  if (!config.connectionUrl) {
    throw new Error('DATABASE_URL is required when PERSISTENCE_BACKEND=postgres')
  }
}
