/**
 * MRP snapshot immutability — deep clone on persist; history entries never mutate.
 */
import type { MrpSnapshot } from './mrp.types'

export function freezeMrpSnapshot(snapshot: MrpSnapshot): MrpSnapshot {
  return structuredClone(snapshot)
}

export function assertSnapshotImmutable(original: MrpSnapshot, current: MrpSnapshot): boolean {
  return JSON.stringify(original) === JSON.stringify(current)
}
