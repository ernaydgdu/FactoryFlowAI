/**
 * Write-path IAM for Shipment — asserts shipping.write.
 */
import { ShipmentDomainError } from '@/domain/shipment/shipment-crud.service'
import { coerceKeplerRole } from '@/domain/platform/iam/types'
import { roleHasPermission } from '@/domain/platform/iam/permission-policy'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'
import { runCommandInTransaction } from '@/application/core/command-transaction'

export function assertShipmentWritePermission(): void {
  const ctx = getRuntimeTenantContext()
  const role = coerceKeplerRole(ctx.role ?? 'VIEWER')
  if (!roleHasPermission(role, 'shipping.write')) {
    throw new ShipmentDomainError('Yetki yok: shipping.write gerekli.')
  }
}

export function runShipmentWriteCommand<T>(fn: () => T): T {
  return runCommandInTransaction(() => {
    assertShipmentWritePermission()
    return fn()
  })
}
