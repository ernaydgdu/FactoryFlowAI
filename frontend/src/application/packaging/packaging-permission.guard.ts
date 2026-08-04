/**
 * Write-path IAM for Packaging — asserts warehouse.write (not route-only).
 */
import { PackagingDomainError } from '@/domain/packaging/packing-list-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertPackagingWritePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'warehouse.write')) {
    throw new PackagingDomainError('Yetki yok: warehouse.write gerekli.')
  }
}

export function runPackagingWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertPackagingWritePermission()
    return fn()
  })
}
