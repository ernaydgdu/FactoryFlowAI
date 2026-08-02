import type { MasterDataBrainChangeEvent } from './types'

const brainChangeFeed: MasterDataBrainChangeEvent[] = []

export function publishMasterDataBrainEvent(event: MasterDataBrainChangeEvent): void {
  brainChangeFeed.unshift(event)
  if (brainChangeFeed.length > 200) brainChangeFeed.length = 200
}

export function getMasterDataBrainChangeFeed(limit = 50): MasterDataBrainChangeEvent[] {
  return brainChangeFeed.slice(0, limit)
}

export function getMasterDataBrainGraphNodes(): Array<{ id: string; label: string; type: string }> {
  return brainChangeFeed.map((e) => ({
    id: `${e.entityType}:${e.entityId}`,
    label: e.entityCode,
    type: e.entityType,
  }))
}

export function seedBrainChangeEvents(events: MasterDataBrainChangeEvent[]): void {
  brainChangeFeed.length = 0
  brainChangeFeed.push(...events)
}

export function countBrainIntegration(): { events: number } {
  return { events: brainChangeFeed.length }
}
