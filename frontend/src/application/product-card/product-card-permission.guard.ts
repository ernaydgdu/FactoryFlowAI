import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runProductCardWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('products.write', fn)
}
