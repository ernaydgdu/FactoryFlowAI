/** AR — ProductionLine aggregate port (P17 pattern) */
import type { PersistedProductionLine } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IProductionLineRepository extends ICodedAggregateRepository<PersistedProductionLine> {}
