/** AR — Customer aggregate port (P17 pattern) */
import type { PersistedCustomer } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface ICustomerRepository extends ICodedAggregateRepository<PersistedCustomer> {}
