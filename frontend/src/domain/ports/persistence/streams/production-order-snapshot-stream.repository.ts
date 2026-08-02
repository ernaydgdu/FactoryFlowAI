/** P05 — ProductionOrderSnapshot stream port */
import type { PersistedProductionOrderSnapshot } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IProductionOrderSnapshotStreamRepository extends IStreamRepository<PersistedProductionOrderSnapshot> {
  latestByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    count: number,
  ): PersistedProductionOrderSnapshot[]
}
