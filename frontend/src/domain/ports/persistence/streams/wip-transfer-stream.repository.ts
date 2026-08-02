/** P11 — WipTransfer stream port */
import type { WipTransfer } from '../../../execution-platform/execution-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedWipTransfer } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IWipTransferStreamRepository extends IStreamRepository<PersistedWipTransfer> {
  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedWipTransfer>
  seedFromLegacyEntries(entries: WipTransfer[]): void
}
