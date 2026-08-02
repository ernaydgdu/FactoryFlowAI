/** P04 — ProductionDailyEntry stream port */
import type { DailyProductionEntryRecord } from '../../../production-order/lifecycle-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedProductionDailyEntry } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IProductionDailyEntryStreamRepository extends IStreamRepository<PersistedProductionDailyEntry> {
  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedProductionDailyEntry>
  seedFromLegacyEntries(entries: DailyProductionEntryRecord[]): void
  nextEntryId(): string
}
