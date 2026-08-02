import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedOrderTimelineEntry } from '@/domain/ports/persistence/persistence-aggregates'
import type { IOrderTimelineStreamRepository } from '@/domain/ports/persistence/streams/order-timeline-stream.repository'
import type { TimelineEntry } from '@/domain/platform/types'

import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class OrderTimelineInMemoryStreamRepository implements IOrderTimelineStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedOrderTimelineEntry[]): void {
    for (const event of events) {
      this.stores.timelineCounter += 1
      this.stores.timelineEntries.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.timelineCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedOrderTimelineEntry[] {
    return this.stores.timelineEntries.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedOrderTimelineEntry> {
    let items = this.stores.timelineEntries.filter((e) => e.tenantId === tenantId)
    const orderId = filter.orderId as string | undefined
    if (orderId) items = items.filter((e) => e.orderId === orderId)
    items = items.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedOrderTimelineEntry[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.timelineEntries.some((e) => e.id === eventId)
  }

  cursorByOrderId(
    tenantId: string,
    orderId: string,
    page: CursorPage,
  ): PageResult<PersistedOrderTimelineEntry> {
    return this.cursor(tenantId, { orderId }, page)
  }

  replaceAll(entries: TimelineEntry[]): void {
    this.stores.seedTimeline(entries)
  }

  seedFromLegacyEntries(entries: TimelineEntry[]): void {
    this.replaceAll(entries)
  }

  allAsLegacy(): TimelineEntry[] {
    return this.stores.timelineEntries.map(
      ({ tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest }) => rest as TimelineEntry,
    )
  }

  nextTimelineId(): string {
    this.stores.timelineCounter += 1
    return `tl-${this.stores.timelineCounter}`
  }
}
