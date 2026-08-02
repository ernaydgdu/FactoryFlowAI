/** P08 — Bundle aggregate port (BundleTicket[] child) */
import type { Bundle } from '../../../execution-platform/execution-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedBundle } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IBundleRepository extends ICodedAggregateRepository<PersistedBundle> {
  findByBarcode(tenantId: string, barcode: string): PersistedBundle | null
  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedBundle>
  cursorByCurrentOperation(
    tenantId: string,
    operationCode: string,
    page: CursorPage,
  ): PageResult<PersistedBundle>
  seedFromLegacy(bundles: Bundle[]): void
  nextBundleId(): string
  nextTicketId(): string
  nextTransferId(): string
}
