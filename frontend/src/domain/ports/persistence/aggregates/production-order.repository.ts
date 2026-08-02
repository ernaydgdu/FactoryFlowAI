/** P03 — ProductionOrder aggregate port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedProductionOrder } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'
import type { ProductionOrderLifecycleRecord, ProductionOrderLifecycleStatus } from '../../../production-order/lifecycle-types'

export interface IProductionOrderRepository extends ICodedAggregateRepository<PersistedProductionOrder> {
  findByProductionOrderNo(tenantId: string, productionOrderNo: string): PersistedProductionOrder | null
  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedProductionOrder[]
  cursorByStatus(
    tenantId: string,
    status: ProductionOrderLifecycleStatus,
    page: CursorPage,
  ): PageResult<PersistedProductionOrder>
  seedFromLegacy(records: ProductionOrderLifecycleRecord[]): void
  nextProductionOrderCounter(): number
}
