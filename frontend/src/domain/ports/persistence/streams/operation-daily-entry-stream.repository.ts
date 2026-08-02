/** P07 — OperationDailyEntry stream port */
import type { OperationDailyEntry } from '../../../execution-platform/execution-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedOperationDailyEntry } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IOperationDailyEntryStreamRepository extends IStreamRepository<PersistedOperationDailyEntry> {
  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedOperationDailyEntry>
  seedFromLegacyEntries(entries: OperationDailyEntry[]): void
  nextEntryId(): string
}
