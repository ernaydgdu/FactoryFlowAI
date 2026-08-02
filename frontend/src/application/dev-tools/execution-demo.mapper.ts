import { runCommandInTransaction } from '@/application/core/command-transaction'
import { initializeDemoExecutionData } from '@/domain/execution-platform/execution-provisioning'
import type { ExecutionRole } from '@/domain/execution-platform/execution-types'

export type InitializeDemoExecutionDataCommand = {
  actor: string
  role: ExecutionRole
}

export type InitializeDemoExecutionDataResult = {
  contextsSynced: number
  bundlesProvisioned: number
}

export function commandInitializeDemoExecutionData(
  input: InitializeDemoExecutionDataCommand,
): InitializeDemoExecutionDataResult {
  void input.role
  return runCommandInTransaction(() => initializeDemoExecutionData(input.actor))
}
