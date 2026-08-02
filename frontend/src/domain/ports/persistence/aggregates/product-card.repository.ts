/** P02 — ProductCard aggregate port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedProductCard } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IProductCardRepository extends ICodedAggregateRepository<PersistedProductCard> {
  findByProductCode(tenantId: string, productCode: string): PersistedProductCard | null
  cursorByBuyer(tenantId: string, buyerId: string, page: CursorPage): PageResult<PersistedProductCard>
}
