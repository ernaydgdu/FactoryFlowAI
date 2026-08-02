import type { ExecutionTimelineEventType } from '@/domain/execution-platform/execution-types'

export type ExecutionTimelineItemDto = {
  id: string
  productionOrderNo: string
  eventType: ExecutionTimelineEventType
  title: string
  description: string
  occurredAt: string
  actor: string
  operationCode: string | null
  bundleId: string | null
}

export type ExecutionTimelineViewModel = {
  productionOrderNo: string
  events: ExecutionTimelineItemDto[]
  eventCatalog: readonly ExecutionTimelineEventType[]
}
