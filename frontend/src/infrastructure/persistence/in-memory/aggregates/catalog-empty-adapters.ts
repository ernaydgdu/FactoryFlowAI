/**
 * Named InMemory adapters for catalog ports awaiting domain migration.
 * Functional empty stores — not generic Empty* stubs.
 */
import type { AggregateRoot } from '@/domain/ports/persistence/persistence.types'

import { EmptyAggregateInMemoryRepository, EmptyStreamInMemoryRepository } from '../empty-repositories'

export class SalesOrderInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class ProductCardInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class StockLedgerInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class StockCardInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class PurchaseOrderInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class FabricCardInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class AccessoryCardInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class BrainConfigInMemoryRepository extends EmptyAggregateInMemoryRepository<AggregateRoot> {}
export class ProductionOrderSnapshotInMemoryStreamRepository extends EmptyStreamInMemoryRepository<AggregateRoot & { streamType: string; streamId: string; sequence: number }> {}
export class StockMovementInMemoryStreamRepository extends EmptyStreamInMemoryRepository<AggregateRoot & { streamType: string; streamId: string; sequence: number }> {}
