import type { DomainEvent, DomainEventType, EventHandler } from '../types'
import { requireUnitOfWork } from '../../ports/persistence/persistence-registry'

/** @deprecated Legacy test hooks — production consumers use outbox worker only */
const handlers = new Map<DomainEventType | '*', EventHandler[]>()

function outboxRepo() {
  return requireUnitOfWork().outbox
}

export type PublishEventInput = {
  type: DomainEventType
  aggregateType: string
  aggregateId: string
  aggregateNo?: string
  payload: Record<string, unknown>
  causedBy: string
  correlationId?: string
}

/**
 * Publish domain event — TX içi outbox enqueue.
 * Brain / Dashboard / Notification / Twin consumers commit sonrası worker'da çalışır.
 */
export function publishEvent(input: PublishEventInput): DomainEvent {
  const event: DomainEvent = {
    id: outboxRepo().nextEventId(),
    type: input.type,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    aggregateNo: input.aggregateNo,
    payload: input.payload,
    occurredAt: new Date().toISOString(),
    causedBy: input.causedBy,
    correlationId: input.correlationId,
  }
  outboxRepo().publishDomainEvent(event)
  return event
}

export function subscribe(eventType: DomainEventType | '*', handler: EventHandler): () => void {
  const list = handlers.get(eventType) ?? []
  list.push(handler)
  handlers.set(eventType, list)
  return () => {
    const idx = list.indexOf(handler)
    if (idx >= 0) list.splice(idx, 1)
  }
}

export function getEvents(filter?: {
  type?: DomainEventType
  aggregateType?: string
  aggregateId?: string
}): DomainEvent[] {
  return outboxRepo().getDomainEvents(filter)
}

export function getEventsByCorrelation(correlationId: string): DomainEvent[] {
  return outboxRepo().getDomainEventsByCorrelation(correlationId)
}

export function getAllEvents(): DomainEvent[] {
  return outboxRepo().getAllDomainEvents()
}

export function seedEvents(events: DomainEvent[]): void {
  outboxRepo().seedFromLegacyEvents(events)
}

export function clearEventHandlers(): void {
  handlers.clear()
}

export function getEventCount(): number {
  return outboxRepo().getDomainEventCount()
}

export function publishOrderCreated(orderId: string, orderNo: string, causedBy: string, payload: Record<string, unknown>) {
  return publishEvent({ type: 'OrderCreated', aggregateType: 'SalesOrder', aggregateId: orderId, aggregateNo: orderNo, payload, causedBy, correlationId: orderId })
}

export function publishBomApproved(entityId: string, causedBy: string, payload: Record<string, unknown>) {
  return publishEvent({ type: 'BomApproved', aggregateType: 'BOM', aggregateId: entityId, payload, causedBy })
}

export function publishStockReceived(entityId: string, causedBy: string, payload: Record<string, unknown>) {
  return publishEvent({ type: 'StockReceived', aggregateType: 'StockMovement', aggregateId: entityId, payload, causedBy })
}

export function publishProductionStarted(orderId: string, orderNo: string, causedBy: string) {
  return publishEvent({ type: 'ProductionStarted', aggregateType: 'ProductionOrder', aggregateId: orderId, aggregateNo: orderNo, payload: {}, causedBy, correlationId: orderId })
}

export function publishShipmentCompleted(orderId: string, orderNo: string, causedBy: string) {
  return publishEvent({ type: 'ShipmentCompleted', aggregateType: 'SalesOrder', aggregateId: orderId, aggregateNo: orderNo, payload: {}, causedBy, correlationId: orderId })
}
