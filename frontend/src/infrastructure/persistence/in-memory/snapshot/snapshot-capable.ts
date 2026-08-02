/** Mixin contract for InMemory repos participating in TX snapshot rollback. */
export interface SnapshotCapable<TState = unknown> {
  captureSnapshot(): TState
  restoreSnapshot(state: TState): void
}

export function isSnapshotCapable(value: unknown): value is SnapshotCapable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'captureSnapshot' in value &&
    'restoreSnapshot' in value &&
    typeof (value as SnapshotCapable).captureSnapshot === 'function' &&
    typeof (value as SnapshotCapable).restoreSnapshot === 'function'
  )
}
