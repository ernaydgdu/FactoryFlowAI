import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExecutionEvent } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExecutionEventStreamRepository } from '@/domain/ports/persistence/streams/execution-event-stream.repository'
import type { ExecutionTimelineEvent, ExecutionTimelineEventType } from '@/domain/execution-platform/execution-types'

import { paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ExecutionEventInMemoryStreamRepository implements IExecutionEventStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedExecutionEvent[]): void {
    for (const event of events) {
      this.stores.executionEventCounter += 1
      this.stores.executionEvents.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.executionEventCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedExecutionEvent[] {
    return this.stores.executionEvents.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedExecutionEvent> {
    let items = this.stores.executionEvents.filter((e) => e.tenantId === tenantId)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    const eventType = filter.eventType as ExecutionTimelineEventType | undefined
    if (productionOrderNo) items = items.filter((e) => e.productionOrderNo === productionOrderNo)
    if (eventType) items = items.filter((e) => e.eventType === eventType)
    items = items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    return paginate(items, page)
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedExecutionEvent[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.executionEvents.some((e) => e.id === eventId)
  }

  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedExecutionEvent> {
    return this.cursor(tenantId, { productionOrderNo }, page)
  }

  cursorByEventType(
    tenantId: string,
    eventType: ExecutionTimelineEventType,
    page: CursorPage,
  ): PageResult<PersistedExecutionEvent> {
    return this.cursor(tenantId, { eventType }, page)
  }

  listByContext(tenantId: string, executionContextId: string): PersistedExecutionEvent[] {
    return this.stores.executionEvents
      .filter((e) => e.tenantId === tenantId && e.executionContextId === executionContextId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }

  seedFromLegacyEntries(entries: ExecutionTimelineEvent[]): void {
    this.stores.executionEvents = entries.map((e, i) => ({
      ...e,
      tenantId: 'kepler-default',
      streamType: 'execution_event',
      streamId: e.productionOrderNo,
      sequence: i + 1,
    }))
    this.stores.executionEventCounter = entries.length
  }

  nextEventId(): string {
    this.stores.executionEventCounter += 1
    return `exe-tl-${String(this.stores.executionEventCounter).padStart(6, '0')}`
  }
}
