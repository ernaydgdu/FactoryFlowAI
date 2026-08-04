import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runQualityWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('quality.write', fn)
}
