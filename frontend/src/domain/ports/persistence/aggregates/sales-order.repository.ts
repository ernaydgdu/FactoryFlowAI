/** P01 — SalesOrder aggregate port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedSalesOrder } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export type SalesOrderRepositoryFilter = {
  customerId?: string
  status?: string
}

export interface ISalesOrderRepository extends ICodedAggregateRepository<PersistedSalesOrder> {
  findByOrderNo(tenantId: string, orderNo: string): PersistedSalesOrder | null
  cursorByCustomer(
    tenantId: string,
    customerId: string,
    page: CursorPage,
  ): PageResult<PersistedSalesOrder>
}
