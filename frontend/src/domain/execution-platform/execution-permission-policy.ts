/**
 * Execution Permission Matrix — Domain Policy (authentication yok)
 */
import type {
  ExecutionPermissionAction,
  ExecutionResourceType,
  ExecutionRole,
} from './execution-types'

type PermissionMatrix = Record<
  ExecutionRole,
  Partial<Record<ExecutionPermissionAction, ExecutionResourceType[]>>
>

const EXECUTION_PERMISSION_MATRIX: PermissionMatrix = {
  Operator: {
    Create: ['DailyEntry', 'WorkSession'],
    Update: ['WorkSession', 'Bundle'],
  },
  LineSupervisor: {
    Create: ['WorkSession', 'DailyEntry', 'WipTransfer'],
    Update: ['WorkSession', 'Operation', 'Bundle'],
    Approve: ['DailyEntry'],
    Reject: ['DailyEntry'],
    Cancel: ['WorkSession'],
    Close: ['WorkSession'],
  },
  Quality: {
    Create: ['QualityGate'],
    Update: ['QualityGate', 'Bundle'],
    Approve: ['QualityGate'],
    Reject: ['QualityGate'],
    Cancel: ['Bundle'],
  },
  Cutting: {
    Create: ['Bundle'],
    Update: ['Bundle'],
    Cancel: ['Bundle'],
  },
  Planning: {
    Create: ['ExecutionContext', 'Split'],
    Update: ['ExecutionContext', 'Operation'],
    Split: ['Split', 'ExecutionContext'],
    Close: ['ExecutionContext'],
  },
  Warehouse: {
    Create: ['WipTransfer'],
    Update: ['Bundle', 'WipTransfer'],
    Close: ['Bundle'],
  },
  FactoryManager: {
    Create: ['ExecutionContext', 'Split', 'Bundle', 'WorkSession', 'QualityGate', 'DailyEntry'],
    Update: ['ExecutionContext', 'Operation', 'Bundle', 'WorkSession', 'QualityGate', 'WipTransfer', 'DailyEntry'],
    Approve: ['QualityGate', 'DailyEntry', 'Split'],
    Reject: ['QualityGate', 'DailyEntry'],
    Split: ['Split', 'ExecutionContext'],
    Cancel: ['Bundle', 'WorkSession', 'ExecutionContext'],
    Close: ['ExecutionContext', 'Operation', 'WorkSession', 'Bundle'],
  },
  CEO: {
    Create: ['ExecutionContext', 'Split', 'Bundle', 'WorkSession', 'QualityGate', 'DailyEntry', 'WipTransfer'],
    Update: ['ExecutionContext', 'Operation', 'Bundle', 'WorkSession', 'QualityGate', 'WipTransfer', 'DailyEntry'],
    Approve: ['QualityGate', 'DailyEntry', 'Split', 'ExecutionContext'],
    Reject: ['QualityGate', 'DailyEntry', 'Split'],
    Split: ['Split', 'ExecutionContext'],
    Cancel: ['Bundle', 'WorkSession', 'ExecutionContext'],
    Close: ['ExecutionContext', 'Operation', 'WorkSession', 'Bundle'],
  },
}

export function canPerformExecutionAction(
  role: ExecutionRole,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
): boolean {
  const rolePerms = EXECUTION_PERMISSION_MATRIX[role]
  if (!rolePerms) return false
  const allowedResources = rolePerms[action]
  if (!allowedResources) return false
  return allowedResources.includes(resource)
}

export function assertExecutionPermission(
  role: ExecutionRole,
  action: ExecutionPermissionAction,
  resource: ExecutionResourceType,
): void {
  if (!canPerformExecutionAction(role, action, resource)) {
    throw new Error(`${role} rolü ${resource} üzerinde ${action} yapamaz`)
  }
}

export function getExecutionPermissionMatrix(): PermissionMatrix {
  return { ...EXECUTION_PERMISSION_MATRIX }
}

export function getRolePermissions(role: ExecutionRole): Partial<Record<ExecutionPermissionAction, ExecutionResourceType[]>> {
  return { ...EXECUTION_PERMISSION_MATRIX[role] }
}
