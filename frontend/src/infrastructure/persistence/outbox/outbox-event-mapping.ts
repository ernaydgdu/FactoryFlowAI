import type { DomainEvent } from '@/domain/platform/types'
import type { OutboxHandler } from '@/domain/ports/persistence/persistence.types'
import type { ExecutionTimelineEventType } from '@/domain/execution-platform/execution-types'

const DOMAIN_EVENT_HANDLERS: Partial<Record<DomainEvent['type'], OutboxHandler[]>> = {
  OrderCreated: ['brain', 'notification', 'ai-memory', 'dashboard'],
  BomApproved: ['brain', 'notification', 'ai-memory', 'digital-twin'],
  ProductionStarted: ['brain', 'dashboard', 'notification', 'digital-twin', 'wip-refresh', 'ai-memory'],
  ProductionFinished: ['brain', 'dashboard', 'notification', 'digital-twin', 'ai-memory'],
  ShipmentCompleted: ['brain', 'notification', 'ai-memory', 'dashboard'],
  ApprovalCompleted: ['brain', 'notification', 'ai-memory'],
  RevisionActivated: ['brain', 'digital-twin', 'ai-memory'],
  EntityUpdated: ['brain', 'dashboard', 'ai-memory'],
}

const EXECUTION_EVENT_HANDLERS: Partial<Record<ExecutionTimelineEventType, OutboxHandler[]>> = {
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

const DEFAULT_DOMAIN_HANDLERS: OutboxHandler[] = ['ai-memory']

export function resolveHandlersForDomainEvent(event: DomainEvent): OutboxHandler[] {
  return DOMAIN_EVENT_HANDLERS[event.type] ?? DEFAULT_DOMAIN_HANDLERS
}

export function resolveHandlersForExecutionEvent(eventType: ExecutionTimelineEventType): OutboxHandler[] {
  return EXECUTION_EVENT_HANDLERS[eventType] ?? ['dashboard']
}

export function resolveHandlersForWipRefresh(): OutboxHandler[] {
  return ['wip-refresh']
}

export function resolveHandlersForMasterDataBrainChange(): OutboxHandler[] {
  return ['brain']
}

export function resolveHandlersForNotificationOnly(): OutboxHandler[] {
  return ['notification']
}
