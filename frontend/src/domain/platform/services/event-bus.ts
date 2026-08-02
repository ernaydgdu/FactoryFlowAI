import type { DomainEvent, DomainEventType, EventHandler } from '../types'

const eventStore: DomainEvent[] = []
const handlers = new Map<DomainEventType | '*', EventHandler[]>()
let eventCounter = 0

export type PublishEventInput = {
  type: DomainEventType
  aggregateType: string
  aggregateId: string
  aggregateNo?: string
  payload: Record<string, unknown>
  causedBy: string
  correlationId?: string
}

export function publishEvent(input: PublishEventInput): DomainEvent {
  eventCounter += 1
  const event: DomainEvent = {
    id: `evt-${eventCounter}`,
    type: input.type,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    aggregateNo: input.aggregateNo,
    payload: input.payload,
    occurredAt: new Date().toISOString(),
    causedBy: input.causedBy,
    correlationId: input.correlationId,
  }
  eventStore.push(event)

  const typeHandlers = handlers.get(input.type) ?? []
  const allHandlers = handlers.get('*') ?? []
  for (const handler of [...typeHandlers, ...allHandlers]) {
    handler(event)
  }
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
  return eventStore.filter((e) => {
    if (filter?.type && e.type !== filter.type) return false
    if (filter?.aggregateType && e.aggregateType !== filter.aggregateType) return false
    if (filter?.aggregateId && e.aggregateId !== filter.aggregateId) return false
    return true
  })
}

export function getEventsByCorrelation(correlationId: string): DomainEvent[] {
  return eventStore.filter((e) => e.correlationId === correlationId)
}

export function getAllEvents(): DomainEvent[] {
  return [...eventStore]
}

export function seedEvents(events: DomainEvent[]): void {
  eventStore.length = 0
  eventStore.push(...events)
  eventCounter = events.length
}

export function clearEventHandlers(): void {
  handlers.clear()
}

export function getEventCount(): number {
  return eventStore.length
}

// Convenience publishers
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
