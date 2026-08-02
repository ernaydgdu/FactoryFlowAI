/** P12 — ExecutionEvent stream port */
import type { ExecutionTimelineEvent, ExecutionTimelineEventType } from '../../../execution-platform/execution-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedExecutionEvent } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IExecutionEventStreamRepository extends IStreamRepository<PersistedExecutionEvent> {
  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedExecutionEvent>
  cursorByEventType(
    tenantId: string,
    eventType: ExecutionTimelineEventType,
    page: CursorPage,
  ): PageResult<PersistedExecutionEvent>
  listByContext(tenantId: string, executionContextId: string): PersistedExecutionEvent[]
  seedFromLegacyEntries(entries: ExecutionTimelineEvent[]): void
  nextEventId(): string
}
