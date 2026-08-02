/** AR — FabricCard aggregate port (P17 pattern) */
import type { PersistedFabricCard } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IFabricCardRepository extends ICodedAggregateRepository<PersistedFabricCard> {}
