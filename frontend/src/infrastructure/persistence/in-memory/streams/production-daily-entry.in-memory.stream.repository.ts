import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedProductionDailyEntry } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductionDailyEntryStreamRepository } from '@/domain/ports/persistence/streams/production-daily-entry-stream.repository'
import type { DailyProductionEntryRecord } from '@/domain/production-order/lifecycle-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ProductionDailyEntryInMemoryStreamRepository implements IProductionDailyEntryStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedProductionDailyEntry[]): void {
    for (const event of events) {
      this.stores.productionDailyEntryCounter += 1
      this.stores.productionDailyEntries.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.productionDailyEntryCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedProductionDailyEntry[] {
    return this.stores.productionDailyEntries.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedProductionDailyEntry> {
    let items = this.stores.productionDailyEntries.filter((e) => e.tenantId === tenantId)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    if (productionOrderNo) items = items.filter((e) => e.productionOrderNo === productionOrderNo)
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedProductionDailyEntry[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.productionDailyEntries.some((e) => e.id === eventId)
  }

  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedProductionDailyEntry> {
    return this.cursor(tenantId, { productionOrderNo }, page)
  }

  seedFromLegacyEntries(entries: DailyProductionEntryRecord[]): void {
    this.stores.productionDailyEntries = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'production_daily_entry',
      streamId: e.productionOrderNo,
      sequence: i + 1,
    }))
    this.stores.productionDailyEntryCounter = entries.length
  }

  nextEntryId(): string {
    this.stores.productionDailyEntryCounter += 1
    return `dpe-${this.stores.productionDailyEntryCounter}`
  }

  allAsLegacy(): DailyProductionEntryRecord[] {
    return this.stores.productionDailyEntries.map(
      ({ tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest }) => rest,
    )
  }
}
