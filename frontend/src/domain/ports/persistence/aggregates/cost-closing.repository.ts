/** AR — CostClosing port. */
import type { PersistedCostClosing } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface ICostClosingRepository extends ICodedAggregateRepository<PersistedCostClosing> {
  findByBatchNo(tenantId: string, batchNo: string): PersistedCostClosing | null
  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedCostClosing | null
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedCostClosing | null
  nextBatchCounter(): number
}
