import { StyleClosingDomainError } from '@/domain/style-closing/style-closing-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertStyleClosePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'style.close')) {
    throw new StyleClosingDomainError('Yetki yok: style.close gerekli.')
  }
}

export function runStyleClosingWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertStyleClosePermission()
    return fn()
  })
}
