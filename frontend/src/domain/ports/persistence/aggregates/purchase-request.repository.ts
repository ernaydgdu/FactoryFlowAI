/** AR — PurchaseRequest aggregate port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedPurchaseRequest } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IPurchaseRequestRepository extends ICodedAggregateRepository<PersistedPurchaseRequest> {
  findByPrNo(tenantId: string, prNo: string): PersistedPurchaseRequest | null
  cursorByStatus(
    tenantId: string,
    status: string,
    page: CursorPage,
  ): PageResult<PersistedPurchaseRequest>
}
