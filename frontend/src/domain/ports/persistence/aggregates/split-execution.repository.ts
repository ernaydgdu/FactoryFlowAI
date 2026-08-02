/** P13 — SplitExecution aggregate port */
import type { SplitExecutionRecord } from '../../../execution-platform/execution-types'
import type { PersistedSplitExecution } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface ISplitExecutionRepository extends ICodedAggregateRepository<PersistedSplitExecution> {
  findByParentProductionOrderNo(
    tenantId: string,
    parentProductionOrderNo: string,
  ): PersistedSplitExecution[]
  seedFromLegacy(records: SplitExecutionRecord[]): void
  nextSplitId(): string
}
