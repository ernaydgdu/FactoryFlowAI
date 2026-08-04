import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runInventoryWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('inventory.write', fn)
}
