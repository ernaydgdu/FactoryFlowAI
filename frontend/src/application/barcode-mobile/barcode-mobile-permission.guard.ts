import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runBarcodeMobileWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('execution.write', fn)
}
