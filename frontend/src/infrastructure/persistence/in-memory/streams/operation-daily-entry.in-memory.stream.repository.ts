import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedOperationDailyEntry } from '@/domain/ports/persistence/persistence-aggregates'
import type { IOperationDailyEntryStreamRepository } from '@/domain/ports/persistence/streams/operation-daily-entry-stream.repository'
import type { OperationDailyEntry } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class OperationDailyEntryInMemoryStreamRepository implements IOperationDailyEntryStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedOperationDailyEntry[]): void {
    for (const event of events) {
      this.stores.operationDailyEntryCounter += 1
      this.stores.operationDailyEntries.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.operationDailyEntryCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedOperationDailyEntry[] {
    return this.stores.operationDailyEntries.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedOperationDailyEntry> {
    let items = this.stores.operationDailyEntries.filter((e) => e.tenantId === tenantId)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    if (productionOrderNo) items = items.filter((e) => e.productionOrderNo === productionOrderNo)
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedOperationDailyEntry[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.operationDailyEntries.some((e) => e.id === eventId)
  }

  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedOperationDailyEntry> {
    return this.cursor(tenantId, { productionOrderNo }, page)
  }

  seedFromLegacyEntries(entries: OperationDailyEntry[]): void {
    this.stores.operationDailyEntries = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'operation_daily_entry',
      streamId: e.productionOrderNo,
      sequence: i + 1,
    }))
    this.stores.operationDailyEntryCounter = entries.length
  }

  nextEntryId(): string {
    this.stores.operationDailyEntryCounter += 1
    return `odentry-${String(this.stores.operationDailyEntryCounter).padStart(6, '0')}`
  }
}
