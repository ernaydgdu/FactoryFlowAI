/** AR — AccessoryCard aggregate port (P17 pattern) */
import type { PersistedAccessoryCard } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IAccessoryCardRepository extends ICodedAggregateRepository<PersistedAccessoryCard> {}
