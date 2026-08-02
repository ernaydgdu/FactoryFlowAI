/**
 * Execution Timeline — gerçek shop floor olayları (append-only, event catalog)
 */
import { addTimelineEntry } from '../platform/services/timeline-service'
import { platformPublish, wirePlatformServices } from '../platform/services/platform-orchestrator'
import { scheduleExecutionSideEffects } from '../platform/services/outbox-scheduler'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedExecutionEvent } from '../ports/persistence/persistence-aggregates'
import type { ExecutionTimelineEvent, ExecutionTimelineEventType } from './execution-types'
import { EXECUTION_EVENT_CATALOG } from './execution-types'

function executionEventRepo() {
  return requireUnitOfWork().executionEvents
}

function eventStreamKey(productionOrderNo: string) {
  return { streamType: 'execution_event', streamId: productionOrderNo }
}

function stripEventMeta(row: PersistedExecutionEvent): ExecutionTimelineEvent {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

export type EmitExecutionEventInput = {
  executionContextId: string
  productionOrderNo: string
  salesOrderId?: string
  salesOrderNo?: string
  eventType: ExecutionTimelineEventType
  title: string
  description: string
  actor: string
  operationCode?: string
  bundleId?: string
  metadata?: Record<string, unknown>
}

export function emitExecutionEvent(input: EmitExecutionEventInput): ExecutionTimelineEvent {
  if (!EXECUTION_EVENT_CATALOG.includes(input.eventType)) {
    throw new Error(`Geçersiz event tipi — catalog dışı: ${input.eventType}`)
  }
  wirePlatformServices()
  const event: ExecutionTimelineEvent = {
    id: executionEventRepo().nextEventId(),
    executionContextId: input.executionContextId,
    productionOrderNo: input.productionOrderNo,
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    occurredAt: new Date().toISOString(),
    actor: input.actor,
    operationCode: input.operationCode,
    bundleId: input.bundleId,
    metadata: input.metadata,
  }

  const persisted: PersistedExecutionEvent = {
    ...event,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'execution_event',
    streamId: input.productionOrderNo,
    sequence: 0,
  }
  executionEventRepo().append(DEFAULT_TENANT_ID, eventStreamKey(input.productionOrderNo), [persisted])

  if (input.salesOrderId && input.salesOrderNo) {
    addTimelineEntry({
      orderId: input.salesOrderId,
      orderNo: input.salesOrderNo,
      eventType: 'StatusChanged',
      description: `[Execution] ${input.title}: ${input.description}`,
      actor: input.actor,
      metadata: {
        executionEventType: input.eventType,
        productionOrderNo: input.productionOrderNo,
        operationCode: input.operationCode,
        bundleId: input.bundleId,
        ...input.metadata,
      },
    })
  }

  platformPublish({
    type: 'EntityUpdated',
    aggregateType: 'ProductionExecution',
    aggregateId: input.executionContextId,
    aggregateNo: input.productionOrderNo,
    payload: { eventType: input.eventType, description: input.description },
    causedBy: input.actor,
  })

  scheduleExecutionSideEffects({
    productionOrderNo: input.productionOrderNo,
    executionContextId: input.executionContextId,
    eventType: input.eventType,
    causedBy: input.actor,
  })

  return event
}

export function getExecutionTimeline(productionOrderNo: string): ExecutionTimelineEvent[] {
  const page = executionEventRepo().cursorByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo, { limit: 1000 })
  return page.items.map(stripEventMeta).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function getExecutionTimelineByContext(executionContextId: string): ExecutionTimelineEvent[] {
  return executionEventRepo()
    .listByContext(DEFAULT_TENANT_ID, executionContextId)
    .map(stripEventMeta)
}

export function getAllExecutionTimelineEvents(): ExecutionTimelineEvent[] {
  const page = executionEventRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: 1000 })
  return page.items.map(stripEventMeta)
}

export function getExecutionEventCatalog(): readonly ExecutionTimelineEventType[] {
  return EXECUTION_EVENT_CATALOG
}
