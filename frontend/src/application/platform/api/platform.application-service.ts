import { resolvePlatformCommandGateway } from '@/infrastructure/platform/commands/platform-command.gateway'
import { fetchPlatformHealth, fetchTenantContext } from '@/infrastructure/api/platform-api.client'
import { getApiRuntimeMode } from '@/infrastructure/api/api-runtime.config'
import { getPersistenceBackend } from '@/infrastructure/persistence/persistence-backend'
import type { PlatformCommandDto } from '@/application/platform/iam/iam.dto'
import type { PlatformHealth } from '@/domain/platform/tenant/types'

export function queryPlatformHealth(): Promise<PlatformHealth> {
  if (getApiRuntimeMode() === 'remote') {
    return fetchPlatformHealth()
  }
  return Promise.resolve({
    status: 'ok',
    runtime: 'local',
    persistence: getPersistenceBackend(),
    apiReachable: true,
    timestamp: new Date().toISOString(),
  })
}

export function queryTenantContextFromApi() {
  return fetchTenantContext()
}

export function queryRegisteredCommands() {
  return resolvePlatformCommandGateway().listCommands()
}

export function commandExecutePlatform(request: PlatformCommandDto) {
  return resolvePlatformCommandGateway().execute(request)
}
