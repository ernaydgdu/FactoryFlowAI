import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runProductionOrderWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('production.write', fn)
}
