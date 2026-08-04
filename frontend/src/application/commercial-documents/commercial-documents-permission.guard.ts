import { CommercialDocumentsDomainError } from '@/domain/commercial-documents/commercial-documents-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertCommercialDocumentsWritePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'shipping.write')) {
    throw new CommercialDocumentsDomainError('Yetki yok: shipping.write gerekli.')
  }
}

export function runCommercialDocumentsWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertCommercialDocumentsWritePermission()
    return fn()
  })
}
