import { FinanceIntegrationDomainError } from '@/domain/finance-integration/finance-integration-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertFinancePostingPermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'finance.write')) {
    throw new FinanceIntegrationDomainError('Yetki yok: finance.write (financial posting) gerekli.')
  }
}

export function runFinanceWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertFinancePostingPermission()
    return fn()
  })
}
