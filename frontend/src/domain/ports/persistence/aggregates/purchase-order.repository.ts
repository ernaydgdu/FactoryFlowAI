/** AR — PurchaseOrder aggregate port */
import type { PersistedPurchaseOrder } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IPurchaseOrderRepository extends ICodedAggregateRepository<PersistedPurchaseOrder> {
  findByPurchaseOrderNo(tenantId: string, purchaseOrderNo: string): PersistedPurchaseOrder | null
}
