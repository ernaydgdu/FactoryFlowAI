/** Domain-safe command transaction runner — infrastructure registers at bootstrap. */

export type CommandTransactionRunner = <T>(fn: () => T) => T

let runner: CommandTransactionRunner | null = null

export function registerCommandTransactionRunner(fn: CommandTransactionRunner): void {
  runner = fn
}

export function runDomainCommandInTransaction<T>(fn: () => T): T {
  if (!runner) {
    throw new Error('Command transaction runner not registered — call ensurePersistenceBootstrapped() first.')
  }
  return runner(fn)
}

export function resetCommandTransactionRunnerForTests(): void {
  runner = null
}
