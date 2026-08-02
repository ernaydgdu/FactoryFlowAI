import type { ExecutionTimelineEvent } from '@/domain/execution-platform/execution-types'
import {
  getAllExecutionTimelineEvents,
  getExecutionEventCatalog,
  getExecutionTimeline,
} from '@/domain/execution-platform/execution-timeline-service'

import type { ExecutionTimelineItemDto, ExecutionTimelineViewModel } from './execution-timeline.dto'

function mapEvent(e: ExecutionTimelineEvent): ExecutionTimelineItemDto {
  return {
    id: e.id,
    productionOrderNo: e.productionOrderNo,
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    occurredAt: e.occurredAt,
    actor: e.actor,
    operationCode: e.operationCode ?? null,
    bundleId: e.bundleId ?? null,
  }
}

export function queryExecutionTimeline(productionOrderNo: string): ExecutionTimelineViewModel {
  return {
    productionOrderNo,
    events: getExecutionTimeline(productionOrderNo).map(mapEvent),
    eventCatalog: getExecutionEventCatalog(),
  }
}

export function queryAllExecutionTimelineEvents(): ExecutionTimelineItemDto[] {
  return getAllExecutionTimelineEvents().map(mapEvent)
}

export function queryExecutionEventCatalog() {
  return getExecutionEventCatalog()
}
