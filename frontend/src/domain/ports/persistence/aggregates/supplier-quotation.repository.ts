/** AR — SupplierQuotation aggregate port */
import type { PersistedSupplierQuotation } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface ISupplierQuotationRepository extends ICodedAggregateRepository<PersistedSupplierQuotation> {
  findByQuotationNo(tenantId: string, quotationNo: string): PersistedSupplierQuotation | null
  findByRfqId(tenantId: string, rfqId: string): PersistedSupplierQuotation[]
}
