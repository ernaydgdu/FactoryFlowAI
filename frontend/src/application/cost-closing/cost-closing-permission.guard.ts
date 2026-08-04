import { CostClosingDomainError } from '@/domain/cost-closing/cost-closing-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertCostClosingWritePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'finance.write')) {
    throw new CostClosingDomainError('Yetki yok: finance.write gerekli.')
  }
}

export function runCostClosingWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertCostClosingWritePermission()
    return fn()
  })
}
