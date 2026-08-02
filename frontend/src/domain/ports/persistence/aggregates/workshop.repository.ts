/** AR — Workshop aggregate port (P17 pattern) */
import type { PersistedWorkshop } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IWorkshopRepository extends ICodedAggregateRepository<PersistedWorkshop> {}
