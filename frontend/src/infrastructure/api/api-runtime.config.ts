/** API runtime mode — local domain vs remote NestJS API. */

export type ApiRuntimeMode = 'local' | 'remote'

const RUNTIME_ENV_KEYS = ['VITE_API_RUNTIME', 'API_RUNTIME'] as const

function readRuntimeEnv(): string | undefined {
  for (const key of RUNTIME_ENV_KEYS) {
    const value = (import.meta.env as Record<string, string | undefined>)[key]
    if (value) return value
  }
  return undefined
}

export function getApiRuntimeMode(): ApiRuntimeMode {
  const raw = readRuntimeEnv()?.trim().toLowerCase()
  if (raw === 'remote' || raw === 'api' || raw === 'backend') return 'remote'
  return 'local'
}

export function isRemoteApiRuntime(): boolean {
  return getApiRuntimeMode() === 'remote'
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '/api'
}
