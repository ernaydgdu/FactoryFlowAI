import { runPermittedWriteCommand } from '@/application/core/command-permission'

export function runIamAdminWriteCommand<T>(fn: () => T): T {
  return runPermittedWriteCommand('platform.users.manage', fn)
}
