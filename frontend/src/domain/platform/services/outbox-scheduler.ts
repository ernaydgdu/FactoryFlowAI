import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { OutboxHandler } from '@/domain/ports/persistence/persistence.types'
import type { MasterDataBrainChangeEvent } from '@/domain/master-data/enterprise/types'
import type { ExecutionTimelineEventType } from '@/domain/execution-platform/execution-types'

function outboxRepo() {
  return requireUnitOfWork().outbox
}

function nextOutboxId(): string {
  return outboxRepo().nextEventId()
}

type OutboxScheduleInput = {
  aggregateType: string
  aggregateId: string
  eventType: string
  payload: Record<string, unknown>
  correlationId: string
  createdAt: string
  causationId?: string
}

function enqueue(input: OutboxScheduleInput, targetHandlers: OutboxHandler[]): void {
  const id = nextOutboxId()
  outboxRepo().enqueue(DEFAULT_TENANT_ID, [
    {
      id,
      tenantId: DEFAULT_TENANT_ID,
      streamType: 'outbox',
      streamId: input.aggregateId,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      correlationId: input.correlationId,
      causationId: input.causationId,
      createdAt: input.createdAt,
      targetHandlers,
    },
  ])
}

/** Schedule WIP read model refresh after commit (constitution §4 — TX dışı). */
export function scheduleWipRefresh(productionOrderNo: string, causedBy = 'system'): void {
  enqueue(
    {
      aggregateType: 'WipPosition',
      aggregateId: productionOrderNo,
      eventType: 'WipRefreshScheduled',
      payload: { productionOrderNo, causedBy },
      correlationId: productionOrderNo,
      createdAt: new Date().toISOString(),
    },
    ['wip-refresh'],
  )
}

/** Schedule master data brain feed update after commit. */
export function scheduleMasterDataBrainChange(event: MasterDataBrainChangeEvent): void {
  enqueue(
    {
      aggregateType: 'MasterData',
      aggregateId: `${event.entityType}:${event.entityId}`,
      eventType: 'MasterDataBrainChange',
      payload: event as unknown as Record<string, unknown>,
      correlationId: event.entityId,
      createdAt: event.occurredAt,
    },
    ['brain'],
  )
}

/** Schedule watcher notification after commit. */
export function scheduleWatcherNotification(input: {
  entityType: string
  entityId: string
  entityNo: string
  description: string
  causedBy: string
}): void {
  enqueue(
    {
      aggregateType: input.entityType,
      aggregateId: input.entityId,
      eventType: 'WatcherNotificationScheduled',
      payload: {
        entityType: input.entityType,
        entityId: input.entityId,
        entityNo: input.entityNo,
        description: input.description,
        causedBy: input.causedBy,
      },
      correlationId: input.entityId,
      createdAt: new Date().toISOString(),
    },
    ['notification'],
  )
}

const EXECUTION_SIDE_EFFECT_HANDLERS: Partial<Record<ExecutionTimelineEventType, OutboxHandler[]>> = {
  ExecutionInitialized: ['wip-refresh', 'brain', 'dashboard'],
  BundleCreated: ['wip-refresh', 'dashboard'],
  BundleMoved: ['wip-refresh', 'brain', 'dashboard', 'notification'],
  BundleIssued: ['wip-refresh', 'dashboard'],
  BundleCompleted: ['wip-refresh', 'brain', 'dashboard'],
  BundleOnHold: ['notification', 'brain', 'dashboard'],
  OperationBlocked: ['notification', 'brain'],
  OperationStarted: ['dashboard', 'brain'],
  OperationCompleted: ['dashboard', 'brain', 'wip-refresh'],
  QualityGateEvaluated: ['brain', 'notification', 'dashboard'],
  QualityRejected: ['brain', 'notification'],
  SplitExecuted: ['wip-refresh', 'brain', 'dashboard', 'digital-twin'],
  DailyEntryPosted: ['dashboard', 'wip-refresh'],
}

/** Schedule execution platform side effects after commit. */
export function scheduleExecutionSideEffects(input: {
  productionOrderNo: string
  executionContextId: string
  eventType: ExecutionTimelineEventType
  causedBy: string
}): void {
  enqueue(
    {
      aggregateType: 'ProductionExecution',
      aggregateId: input.executionContextId,
      eventType: input.eventType,
      payload: {
        productionOrderNo: input.productionOrderNo,
        executionContextId: input.executionContextId,
        causedBy: input.causedBy,
      },
      correlationId: input.productionOrderNo,
      createdAt: new Date().toISOString(),
    },
    EXECUTION_SIDE_EFFECT_HANDLERS[input.eventType] ?? ['dashboard'],
  )
}

export { enqueue as enqueueOutboxMessage }
