/** P16 — StockCard aggregate port (Master Data) */
import type { PersistedStockCard } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IStockCardRepository extends ICodedAggregateRepository<PersistedStockCard> {}
