/**
 * Map Kepler IAM session role → ExecutionRole for command-path authz.
 * Client-claimed ExecutionRole must not grant privileges (TD-P0-04).
 */
import { coerceKeplerRole, type KeplerRole } from '@/domain/platform/iam/types'
import type { ExecutionRole } from '@/domain/execution-platform/execution-types'
import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'

const KEPLER_TO_EXECUTION: Record<KeplerRole, ExecutionRole> = {
  ADMIN: 'CEO',
  MANAGER: 'FactoryManager',
  PLANNER: 'Planning',
  SHOP_FLOOR_OPERATOR: 'Operator',
  VIEWER: 'Operator',
}

export function mapKeplerRoleToExecutionRole(role: KeplerRole): ExecutionRole {
  return KEPLER_TO_EXECUTION[role]
}

/** Trusted execution role from runtime IAM session — ignores client payload role. */
export function resolveTrustedExecutionRole(): ExecutionRole {
  const kepler = coerceKeplerRole(getRuntimeTenantContext().role)
  return mapKeplerRoleToExecutionRole(kepler)
}
