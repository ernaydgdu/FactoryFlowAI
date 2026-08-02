/** P09 — OperationWorkSession stream port */
import type { OperationWorkSession } from '../../../execution-platform/execution-types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedOperationWorkSession } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IOperationWorkSessionStreamRepository extends IStreamRepository<PersistedOperationWorkSession> {
  findActiveByOperation(
    tenantId: string,
    productionOrderNo: string,
    operationCode: string,
  ): PersistedOperationWorkSession | null
  cursorByBundleId(tenantId: string, bundleId: string, page: CursorPage): PageResult<PersistedOperationWorkSession>
  listByProductionOrder(tenantId: string, productionOrderNo: string, operationCode?: string): PersistedOperationWorkSession[]
  seedFromLegacyEntries(entries: OperationWorkSession[]): void
  nextSessionId(): string
  updateSession(tenantId: string, session: OperationWorkSession): void
}
