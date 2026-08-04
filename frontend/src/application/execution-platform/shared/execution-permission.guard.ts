import {
  assertExecutionPermission,
  canPerformExecutionAction,
} from '@/domain/execution-platform/execution-permission-policy'
import type {
  ExecutionPermissionAction,
  ExecutionResourceType,
  ExecutionRole,
} from '@/domain/execution-platform/execution-types'

import { assertCommandPermission } from '@/application/core/command-permission'
import { runCommandInTransaction } from '@/application/core/command-transaction'
import { resolveTrustedExecutionRole } from './kepler-execution-role'

export type ExecutionActorContext = {
  actor: string
  /** @deprecated Ignored for authorization — Kepler session role is authoritative (TD-P0-04). */
  role: ExecutionRole
}

export function guardExecutionPermission(
  role: ExecutionRole,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
): void {
  assertExecutionPermission(role, action, resource)
}

export function checkExecutionPermission(
  role: ExecutionRole,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
): boolean {
  return canPerformExecutionAction(role, action, resource)
}

/**
 * Execution writes: require Kepler `execution.write`, then enforce Execution matrix
 * using the session-mapped role (never the client-claimed role).
 */
export function runWithExecutionPermission<T>(
  _ctx: ExecutionActorContext,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
  fn: () => T,
): T {
  return runCommandInTransaction(() => {
    assertCommandPermission('execution.write')
    const trustedRole = resolveTrustedExecutionRole()
    guardExecutionPermission(trustedRole, action, resource)
    return fn()
  })
}
