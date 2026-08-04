import { ExportLogisticsDomainError } from '@/domain/export-logistics/export-logistics-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertExportLogisticsWritePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'shipping.write')) {
    throw new ExportLogisticsDomainError('Yetki yok: shipping.write gerekli.')
  }
}

export function runExportLogisticsWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertExportLogisticsWritePermission()
    return fn()
  })
}
