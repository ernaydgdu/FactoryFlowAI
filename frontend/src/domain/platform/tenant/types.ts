/** Platform tenant & request context (Phase 1 API scaffold). */

export const DEFAULT_TENANT_ID = 'kepler-default'

export type TenantContext = {
  tenantId: string
  factoryId: string
  userId: string | null
  userEmail: string | null
  role: string | null
}

export type PlatformHealth = {
  status: 'ok' | 'degraded'
  runtime: 'local' | 'remote'
  persistence: 'memory' | 'postgres'
  apiReachable: boolean
  timestamp: string
}

export type PlatformCommandRequest = {
  commandKey: string
  payload?: Record<string, unknown>
}

export type PlatformCommandResult<T = unknown> = {
  commandKey: string
  success: boolean
  data?: T
  error?: string
  executedAt: string
}
