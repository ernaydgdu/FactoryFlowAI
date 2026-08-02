/** P15 — StockMovement stream port */
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedStockMovement } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IStockMovementStreamRepository extends IStreamRepository<PersistedStockMovement> {
  cursorByLedgerId(tenantId: string, ledgerId: string, page: CursorPage): PageResult<PersistedStockMovement>
  cursorByStockCardId(tenantId: string, stockCardId: string, page: CursorPage): PageResult<PersistedStockMovement>
}
