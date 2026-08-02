/** P10 — QualityGateEvaluation stream port */
import type { QualityGateEvaluation } from '../../../execution-platform/execution-types'
import type { PersistedQualityGateEvaluation } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IQualityGateEvaluationStreamRepository extends IStreamRepository<PersistedQualityGateEvaluation> {
  latestByBundleAndOperation(
    tenantId: string,
    bundleId: string,
    operationCode: string,
  ): PersistedQualityGateEvaluation | null
  listByProductionOrder(tenantId: string, productionOrderNo: string): PersistedQualityGateEvaluation[]
  latestByProductionOrderGate(
    tenantId: string,
    productionOrderNo: string,
    gateType: string,
    operationCode: string,
  ): PersistedQualityGateEvaluation | null
  seedFromLegacyEntries(entries: QualityGateEvaluation[]): void
  nextGateId(): string
}
