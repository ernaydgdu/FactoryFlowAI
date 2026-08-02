import type { MasterDataBrainChangeEvent } from '@/domain/master-data/enterprise/types'
import type { IMasterDataBrainChangeStreamRepository } from '@/domain/ports/persistence/streams/master-data-brain-change-stream.repository'

export class MasterDataBrainChangeStreamInMemoryRepository implements IMasterDataBrainChangeStreamRepository {
  private events: MasterDataBrainChangeEvent[] = []
  private readonly maxEvents = 200

  captureSnapshot(): MasterDataBrainChangeEvent[] {
    return structuredClone(this.events)
  }

  restoreSnapshot(events: MasterDataBrainChangeEvent[]): void {
    this.events = structuredClone(events)
  }

  publish(_tenantId: string, event: MasterDataBrainChangeEvent): void {
    this.events.unshift(event)
    if (this.events.length > this.maxEvents) this.events.length = this.maxEvents
  }

  getFeed(_tenantId: string, limit = 50): MasterDataBrainChangeEvent[] {
    return this.events.slice(0, limit)
  }

  getAll(_tenantId: string): MasterDataBrainChangeEvent[] {
    return [...this.events]
  }

  seedFromLegacy(_tenantId: string, events: MasterDataBrainChangeEvent[]): void {
    this.events = [...events]
  }
}

export const masterDataBrainChangeStreamInMemory = new MasterDataBrainChangeStreamInMemoryRepository()
