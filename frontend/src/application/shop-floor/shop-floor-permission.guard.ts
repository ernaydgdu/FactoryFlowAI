import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runShopFloorWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('execution.write', fn)
}
