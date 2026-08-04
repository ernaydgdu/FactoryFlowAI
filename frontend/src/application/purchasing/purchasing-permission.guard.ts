import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runPurchasingWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('purchasing.write', fn)
}
