import type { CursorPage, OutboxEnqueueInput, OutboxMessage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { IDomainEventOutboxRepository } from '@/domain/ports/persistence/outbox/domain-event-outbox.repository'
import type { DomainEvent } from '@/domain/platform/types'

import { resolveHandlersForDomainEvent } from '../../outbox/outbox-event-mapping'
import { isTransactionActive } from '../../transaction/transaction-state'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

let immediateDispatch: ((tenantId: string) => void) | null = null

export function setOutboxImmediateDispatch(fn: (tenantId: string) => void): void {
  immediateDispatch = fn
}

export class DomainEventOutboxInMemoryRepository implements IDomainEventOutboxRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  enqueue(tenantId: string, messages: OutboxEnqueueInput[]): void {
    for (const msg of messages) {
      this.stores.outboxCounter += 1
      this.stores.outboxMessages.push({
        ...msg,
        tenantId,
        streamType: 'outbox',
        streamId: msg.aggregateId,
        sequence: this.stores.outboxCounter,
        publishedAt: null,
        publishAttempts: 0,
        lastError: null,
      })
    }
    if (!isTransactionActive() && immediateDispatch) {
      immediateDispatch(tenantId)
    }
  }

  claimPending(tenantId: string, batchSize: number): OutboxMessage[] {
    return this.stores.outboxMessages
      .filter((m) => m.tenantId === tenantId && m.publishedAt == null)
      .slice(0, batchSize)
  }

  markPublished(tenantId: string, messageIds: string[]): void {
    const now = new Date().toISOString()
    for (const id of messageIds) {
      const msg = this.stores.outboxMessages.find((m) => m.tenantId === tenantId && m.id === id)
      if (msg) msg.publishedAt = now
    }
  }

  markFailed(tenantId: string, messageId: string, error: string): void {
    const msg = this.stores.outboxMessages.find((m) => m.tenantId === tenantId && m.id === messageId)
    if (msg) {
      msg.publishAttempts += 1
      msg.lastError = error
    }
  }

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<OutboxMessage> {
    const items = this.stores.outboxMessages.filter((m) => m.tenantId === tenantId)
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  /** Domain event → outbox enqueue (TX içi). Consumer dispatch commit sonrası worker'da. */
  publishDomainEvent(event: DomainEvent): void {
    this.stores.domainEvents.push(event)
    this.enqueue('kepler-default', [
      {
        id: event.id,
        tenantId: 'kepler-default',
        streamType: 'outbox',
        streamId: event.aggregateId,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.type,
        payload: {
          ...event.payload,
          aggregateNo: event.aggregateNo,
          causedBy: event.causedBy,
        },
        correlationId: event.correlationId ?? event.id,
        createdAt: event.occurredAt,
        targetHandlers: resolveHandlersForDomainEvent(event),
      },
    ])
  }

  getDomainEvents(filter?: {
    type?: DomainEvent['type']
    aggregateType?: string
    aggregateId?: string
  }): DomainEvent[] {
    return this.stores.domainEvents.filter((e) => {
      if (filter?.type && e.type !== filter.type) return false
      if (filter?.aggregateType && e.aggregateType !== filter.aggregateType) return false
      if (filter?.aggregateId && e.aggregateId !== filter.aggregateId) return false
      return true
    })
  }

  getDomainEventsByCorrelation(correlationId: string): DomainEvent[] {
    return this.stores.domainEvents.filter((e) => e.correlationId === correlationId)
  }

  getAllDomainEvents(): DomainEvent[] {
    return [...this.stores.domainEvents]
  }

  replaceDomainEvents(events: DomainEvent[]): void {
    this.stores.seedEvents(events)
  }

  seedFromLegacyEvents(events: DomainEvent[]): void {
    this.replaceDomainEvents(events)
  }

  getDomainEventCount(): number {
    return this.stores.domainEvents.length
  }

  nextEventId(): string {
    this.stores.eventCounter += 1
    return `evt-${this.stores.eventCounter}`
  }
}
