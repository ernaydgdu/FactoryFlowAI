/** P14 — StockLedger aggregate port */
import type { PersistedStockLedger } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IStockLedgerRepository extends ICodedAggregateRepository<PersistedStockLedger> {
  findByWarehouseCode(tenantId: string, warehouseCode: string): PersistedStockLedger | null
}
