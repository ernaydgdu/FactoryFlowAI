/** AR — Warehouse aggregate port (P17 pattern) */
import type { PersistedWarehouse } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IWarehouseRepository extends ICodedAggregateRepository<PersistedWarehouse> {}
