/** AR — PackingList aggregate port (packages embedded). */
import type { PersistedPackingList } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IPackingListRepository extends ICodedAggregateRepository<PersistedPackingList> {
  findByPackingListNo(tenantId: string, packingListNo: string): PersistedPackingList | null
  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedPackingList[]
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedPackingList | null
}
