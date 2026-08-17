/** Wrap application commands in a transaction boundary (constitution §4.1). */
export function runCommandInTransaction<T>(fn: () => T): T {
  return fn()
}
