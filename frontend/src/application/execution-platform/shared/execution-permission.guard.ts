import {
  assertExecutionPermission,
  canPerformExecutionAction,
} from '@/domain/execution-platform/execution-permission-policy'
import type {
  ExecutionPermissionAction,
  ExecutionResourceType,
  ExecutionRole,
} from '@/domain/execution-platform/execution-types'

import { runCommandInTransaction } from '@/application/core/command-transaction'

export type ExecutionActorContext = {
  actor: string
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

export function runWithExecutionPermission<T>(
  ctx: ExecutionActorContext,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
  fn: () => T,
): T {
  guardExecutionPermission(ctx.role, action, resource)
  return runCommandInTransaction(fn)
}
