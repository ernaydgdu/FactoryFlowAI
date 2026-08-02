/** P23 — WipPosition read model port */
import type { WipPosition } from '../../../execution-platform/execution-types'
import type { WipPositionReadModel } from '../persistence-aggregates'
import type { IReadModelRepository } from '../repository.base'

export interface IWipPositionReadModel extends IReadModelRepository<WipPositionReadModel> {
  refreshByProductionOrderNo(tenantId: string, productionOrderNo: string): void
  refreshGlobal(tenantId: string): void
  setPositions(tenantId: string, positions: WipPosition[]): void
  getPositions(tenantId: string, productionOrderNo: string): WipPosition[]
  getAllPositions(tenantId: string): WipPosition[]
  clearAll(tenantId: string): void
}
