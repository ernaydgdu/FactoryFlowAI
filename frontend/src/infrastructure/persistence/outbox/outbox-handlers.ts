import type { DomainEvent } from '@/domain/platform/types'
import type { MasterDataBrainChangeEvent } from '@/domain/master-data/enterprise/types'
import type { OutboxHandler, OutboxMessage } from '@/domain/ports/persistence/persistence.types'

type OutboxHandlerFn = (message: OutboxMessage) => void

export type OutboxHandlerDeps = {
  publishMasterDataBrainEventToStream: (event: MasterDataBrainChangeEvent) => void
  rebuildWipIndex: (productionOrderNo: string) => void
  recordFromDomainEvent: (event: DomainEvent) => void
  notifyWatchers: (
    entityType: string,
    entityId: string,
    entityNo: string,
    description: string,
  ) => void
}

let deps: OutboxHandlerDeps | null = null

export function registerOutboxHandlerDeps(next: OutboxHandlerDeps): void {
  deps = next
}

export function resetOutboxHandlerDepsForTests(): void {
  deps = null
}

function outboxDeps(): OutboxHandlerDeps {
  if (!deps) {
    throw new Error('Outbox handler deps not registered — call ensureOutboxHandlersLoaded() first')
  }
  return deps
}

function handleBrain(message: OutboxMessage): void {
  if (message.eventType === 'MasterDataBrainChange') {
    const event = message.payload as unknown as MasterDataBrainChangeEvent
    outboxDeps().publishMasterDataBrainEventToStream(event)
    return
  }

  if (message.aggregateType === 'ProductionExecution' || message.aggregateType === 'ProductionOrder') {
    // Brain read model is query-time; worker records ingest marker only (no command-path reads).
    return
  }
}

function handleDashboard(_message: OutboxMessage): void {
  // Dashboard is query-time aggregation — worker confirms invalidation without command-path reads.
}

function handleNotification(message: OutboxMessage): void {
  const entityType = String(message.payload.entityType ?? message.aggregateType)
  const entityId = String(message.payload.entityId ?? message.aggregateId)
  const entityNo = String(message.payload.entityNo ?? message.payload.aggregateNo ?? entityId)
  const description = String(message.payload.description ?? message.payload.summary ?? message.eventType)
  outboxDeps().notifyWatchers(entityType, entityId, entityNo, description)
}

function handleDigitalTwin(_message: OutboxMessage): void {
  // Twin invalidation marker — full simulation remains explicit query API only.
}

function handleWipRefresh(message: OutboxMessage): void {
  const productionOrderNo = String(
    message.payload.productionOrderNo ?? message.payload.aggregateNo ?? message.aggregateId,
  )
  if (productionOrderNo) {
    outboxDeps().rebuildWipIndex(productionOrderNo)
  }
}

function handleAiMemory(message: OutboxMessage): void {
  if (message.eventType === 'MasterDataBrainChange' || message.eventType === 'WipRefreshScheduled') {
    return
  }
  const event: DomainEvent = {
    id: message.id,
    type: message.eventType as DomainEvent['type'],
    aggregateType: message.aggregateType,
    aggregateId: message.aggregateId,
    aggregateNo: message.payload.aggregateNo as string | undefined,
    payload: message.payload,
    occurredAt: message.createdAt,
    causedBy: String(message.payload.causedBy ?? 'system'),
    correlationId: message.correlationId,
  }
  outboxDeps().recordFromDomainEvent(event)
}

const HANDLER_REGISTRY: Record<OutboxHandler, OutboxHandlerFn> = {
  brain: handleBrain,
  dashboard: handleDashboard,
  notification: handleNotification,
  'digital-twin': handleDigitalTwin,
  'wip-refresh': handleWipRefresh,
  'ai-memory': handleAiMemory,
}

export function dispatchOutboxMessage(message: OutboxMessage): void {
  for (const handler of message.targetHandlers) {
    const fn = HANDLER_REGISTRY[handler]
    if (fn) fn(message)
  }
}

export function getRegisteredOutboxHandlers(): OutboxHandler[] {
  return Object.keys(HANDLER_REGISTRY) as OutboxHandler[]
}
