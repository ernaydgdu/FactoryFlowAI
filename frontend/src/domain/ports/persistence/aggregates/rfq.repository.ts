/** AR — RequestForQuotation aggregate port */
import type { PersistedRequestForQuotation } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IRequestForQuotationRepository extends ICodedAggregateRepository<PersistedRequestForQuotation> {
  findByRfqNo(tenantId: string, rfqNo: string): PersistedRequestForQuotation | null
}
