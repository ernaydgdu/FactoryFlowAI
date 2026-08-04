/** AR — PurchaseOrder aggregate port */
import type { PersistedPurchaseOrderAggregate } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IPurchaseOrderRepository extends ICodedAggregateRepository<PersistedPurchaseOrderAggregate> {
  findByPurchaseOrderNo(tenantId: string, purchaseOrderNo: string): PersistedPurchaseOrderAggregate | null
}
