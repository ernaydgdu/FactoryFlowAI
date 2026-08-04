/** AR — StyleClosing port. */
import type { PersistedStyleClosing } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IStyleClosingRepository extends ICodedAggregateRepository<PersistedStyleClosing> {
  findByBatchNo(tenantId: string, batchNo: string): PersistedStyleClosing | null
  findByProductCardId(tenantId: string, productCardId: string): PersistedStyleClosing | null
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedStyleClosing | null
  nextBatchCounter(): number
}
