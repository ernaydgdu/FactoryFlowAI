/** Sprint 7.8 — persistence backend selection (default: in-memory). */

export type PersistenceBackend = 'memory' | 'postgres'

const BACKEND_ENV_KEYS = ['VITE_PERSISTENCE_BACKEND', 'PERSISTENCE_BACKEND'] as const

function readBackendEnv(): string | undefined {
  for (const key of BACKEND_ENV_KEYS) {
    const value = (import.meta.env as Record<string, string | undefined>)[key]
    if (value) return value
  }
  return undefined
}

export function getPersistenceBackend(): PersistenceBackend {
  const raw = readBackendEnv()?.trim().toLowerCase()
  if (raw === 'postgres' || raw === 'postgresql' || raw === 'pg') return 'postgres'
  return 'memory'
}

export function isPostgresBackend(): boolean {
  return getPersistenceBackend() === 'postgres'
}
