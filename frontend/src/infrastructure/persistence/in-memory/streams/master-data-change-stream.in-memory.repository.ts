import type { MasterDataChangeRecord } from '@/domain/master-data/enterprise/types'
import type { MasterDataEntityType } from '@/domain/master-data/types'
import type { IMasterDataChangeStreamRepository } from '@/domain/ports/persistence/streams/master-data-change-stream.repository'

export class MasterDataChangeStreamInMemoryRepository implements IMasterDataChangeStreamRepository {
  private records: MasterDataChangeRecord[] = []
  private counter = 0

  captureSnapshot(): { records: MasterDataChangeRecord[]; counter: number } {
    return { records: structuredClone(this.records), counter: this.counter }
  }

  restoreSnapshot(state: { records: MasterDataChangeRecord[]; counter: number }): void {
    this.records = structuredClone(state.records)
    this.counter = state.counter
  }

  append(_tenantId: string, record: MasterDataChangeRecord): void {
    this.records.push(record)
  }

  findByEntity(
    _tenantId: string,
    entityType: MasterDataEntityType,
    entityId: string,
  ): MasterDataChangeRecord[] {
    return this.records.filter((c) => c.entityType === entityType && c.entityId === entityId)
  }

  findAll(_tenantId: string): MasterDataChangeRecord[] {
    return [...this.records]
  }

  nextChangeId(_tenantId: string): string {
    this.counter += 1
    return `mdc-${String(this.counter).padStart(6, '0')}`
  }

  seedFromLegacy(_tenantId: string, records: MasterDataChangeRecord[]): void {
    this.records = [...records]
    this.counter = records.length
  }
}

export const masterDataChangeStreamInMemory = new MasterDataChangeStreamInMemoryRepository()
