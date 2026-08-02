/** P06 — ExecutionContext aggregate port (OperationExecution[] child) */
import type { ExecutionContext } from '../../../execution-platform/execution-types'
import type { PersistedExecutionContext } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IExecutionContextRepository extends ICodedAggregateRepository<PersistedExecutionContext> {
  findByProductionOrderNo(tenantId: string, productionOrderNo: string): PersistedExecutionContext | null
  seedFromLegacy(contexts: ExecutionContext[]): void
  nextContextId(): string
  nextOperationId(): string
}
