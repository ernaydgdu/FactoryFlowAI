/** P21 — OrderTimeline stream port */
import type { TimelineEntry } from '../../../platform/types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedOrderTimelineEntry } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IOrderTimelineStreamRepository extends IStreamRepository<PersistedOrderTimelineEntry> {
  cursorByOrderId(tenantId: string, orderId: string, page: CursorPage): PageResult<PersistedOrderTimelineEntry>
  seedFromLegacyEntries(entries: TimelineEntry[]): void
  nextTimelineId(): string
}
