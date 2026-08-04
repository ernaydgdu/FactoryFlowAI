import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runSalesOrderWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('orders.write', fn)
}
