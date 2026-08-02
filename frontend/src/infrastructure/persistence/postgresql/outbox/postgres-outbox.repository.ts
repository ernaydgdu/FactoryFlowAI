/** Sprint 7.4 — outbox table adapter skeleton. */
import type { CursorPage, OutboxEnqueueInput, OutboxMessage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { IDomainEventOutboxRepository } from '@/domain/ports/persistence/outbox/domain-event-outbox.repository'
import type { DomainEvent } from '@/domain/platform/types'

import { PostgresAdapterNotReadyError } from '../postgres-not-implemented.error'

function notReady(): never {
  throw new PostgresAdapterNotReadyError('postgres-outbox.repository')
}

export class PostgresOutboxRepository implements IDomainEventOutboxRepository {
  enqueue(_tenantId: string, _messages: OutboxEnqueueInput[]): void {
    notReady()
  }

  claimPending(_tenantId: string, _batchSize: number): OutboxMessage[] {
    notReady()
  }

  markPublished(_tenantId: string, _messageIds: string[]): void {
    notReady()
  }

  markFailed(_tenantId: string, _messageId: string, _error: string): void {
    notReady()
  }

  cursor(_tenantId: string, _filter: Record<string, unknown>, _page: CursorPage): PageResult<OutboxMessage> {
    notReady()
  }

  publishDomainEvent(_event: DomainEvent): void {
    notReady()
  }

  getDomainEvents(_filter?: {
    type?: DomainEvent['type']
    aggregateType?: string
    aggregateId?: string
  }): DomainEvent[] {
    notReady()
  }

  getDomainEventsByCorrelation(_correlationId: string): DomainEvent[] {
    notReady()
  }

  getAllDomainEvents(): DomainEvent[] {
    notReady()
  }

  seedFromLegacyEvents(_events: DomainEvent[]): void {
    notReady()
  }

  getDomainEventCount(): number {
    notReady()
  }

  nextEventId(): string {
    notReady()
  }
}

export const postgresOutboxRepository = new PostgresOutboxRepository()
