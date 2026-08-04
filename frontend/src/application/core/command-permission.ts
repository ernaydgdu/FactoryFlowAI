/**
 * Shared command-path permission assertion — not route-only.
 */
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission, type Permission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export class CommandPermissionError extends Error {
  constructor(permission: Permission) {
    super(`Yetki yok: ${permission} gerekli.`)
    this.name = 'CommandPermissionError'
  }
}

export function assertCommandPermission(permission: Permission): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, permission)) {
    throw new CommandPermissionError(permission)
  }
}

export function runPermittedWriteCommand<T>(permission: Permission, fn: () => T): T {
  return runCommandInTransaction(() => {
    assertCommandPermission(permission)
    return fn()
  })
}
