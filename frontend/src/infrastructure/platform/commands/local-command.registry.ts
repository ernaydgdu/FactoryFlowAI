import type { PlatformCommandHandler } from '@/domain/ports/platform/platform-command.port'
import type { PlatformCommandResult } from '@/domain/platform/tenant/types'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { listUserAccounts } from '@/domain/platform/iam/user-account.service'
import { getPersistenceBackend } from '@/infrastructure/persistence/persistence-backend'
import { getApiRuntimeMode } from '@/infrastructure/api/api-runtime.config'

function ok<T>(commandKey: string, data: T): PlatformCommandResult<T> {
  return {
    commandKey,
    success: true,
    data,
    executedAt: new Date().toISOString(),
  }
}

const handlers = new Map<string, PlatformCommandHandler>()

handlers.set('platform.ping', () =>
  ok('platform.ping', {
    message: 'pong',
    runtime: getApiRuntimeMode(),
    persistence: getPersistenceBackend(),
  }),
)

handlers.set('platform.getContext', () => ok('platform.getContext', getRuntimeTenantContext()))

handlers.set('iam.listUsers', (payload) => {
  const ctx = getRuntimeTenantContext()
  const factoryId =
    typeof payload?.factoryId === 'string' ? payload.factoryId : ctx.factoryId
  const users = listUserAccounts(ctx.tenantId, factoryId)
  return ok('iam.listUsers', { users, count: users.length })
})

export function getLocalCommandHandler(commandKey: string): PlatformCommandHandler | null {
  return handlers.get(commandKey) ?? null
}

export function listLocalCommandKeys(): string[] {
  return [...handlers.keys()].sort()
}

export function registerLocalCommandHandler(
  commandKey: string,
  handler: PlatformCommandHandler,
): void {
  handlers.set(commandKey, handler)
}
