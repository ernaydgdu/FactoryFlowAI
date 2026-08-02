/** P22 — DomainEventOutbox port */
import type { CursorPage, OutboxEnqueueInput, OutboxMessage, PageResult } from '../persistence.types'
import type { DomainEvent } from '../../../platform/types'

export interface IDomainEventOutboxRepository {
  enqueue(tenantId: string, messages: OutboxEnqueueInput[]): void
  claimPending(tenantId: string, batchSize: number): OutboxMessage[]
  markPublished(tenantId: string, messageIds: string[]): void
  markFailed(tenantId: string, messageId: string, error: string): void
  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<OutboxMessage>

  /** Legacy domain event store — publishEvent uyumu */
  publishDomainEvent(event: DomainEvent): void
  getDomainEvents(filter?: {
    type?: DomainEvent['type']
    aggregateType?: string
    aggregateId?: string
  }): DomainEvent[]
  getDomainEventsByCorrelation(correlationId: string): DomainEvent[]
  getAllDomainEvents(): DomainEvent[]
  seedFromLegacyEvents(events: DomainEvent[]): void
  getDomainEventCount(): number
  nextEventId(): string
}
