/** AR — GoodsReceipt aggregate port */
import type { PersistedGoodsReceipt } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IGoodsReceiptRepository extends ICodedAggregateRepository<PersistedGoodsReceipt> {
  findByGrNo(tenantId: string, grNo: string): PersistedGoodsReceipt | null
  findByPurchaseOrderId(tenantId: string, purchaseOrderId: string): PersistedGoodsReceipt[]
}
