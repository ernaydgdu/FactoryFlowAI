import { registerUnitOfWorkFactory } from '@/domain/ports/persistence/persistence-registry'

import { wirePersistenceRuntime, resetPersistenceRuntimeWireForTests } from './bootstrap-runtime'
import { ensureMasterDataLookupsSeeded } from './in-memory/master-data-seed.bootstrap'
import { ensureProductCardsSeeded } from './in-memory/product-card-seed.bootstrap'
import { ensureMrpRunsSeeded } from './in-memory/mrp-seed.bootstrap'
import { ensureInventorySeeded } from './in-memory/inventory-seed.bootstrap'
import { ensureSalesOrdersSeeded } from './in-memory/sales-order-seed.bootstrap'
import { ensureStockCardsSeeded } from './in-memory/stock-card-seed.bootstrap'
import { ensurePlatformSeeded } from './in-memory/platform-seed.bootstrap'
import { ensureUserAccountsSeeded } from './in-memory/user-account-seed.bootstrap'
import { getPersistenceBackend } from './persistence-backend'
import { resolveUnitOfWorkFactory } from './persistence-unit-of-work-factory'
import { configurePostgresPool } from './postgresql/postgres-connection-pool'
import { resetOutboxHandlerDepsForTests } from './outbox/outbox-handlers'
import { resetOutboxHandlersLoaderForTests } from './outbox/outbox-handlers-loader'
import { resetOutboxFlushForTests } from './transaction/transaction-runtime'

let bootstrapped = false
let bootstrapping: Promise<void> | null = null

export function ensurePersistenceBootstrapped(): Promise<void> {
  if (bootstrapped) return Promise.resolve()
  if (!bootstrapping) {
    bootstrapping = Promise.resolve().then(() => {
      if (getPersistenceBackend() === 'postgres') {
        configurePostgresPool()
      }
      registerUnitOfWorkFactory(resolveUnitOfWorkFactory())
      if (getPersistenceBackend() === 'memory') {
        ensureMasterDataLookupsSeeded()
        ensurePlatformSeeded()
        ensureStockCardsSeeded()
        ensureProductCardsSeeded()
        ensureSalesOrdersSeeded()
        ensureMrpRunsSeeded()
        ensureInventorySeeded()
        return ensureUserAccountsSeeded()
      }
      return undefined
    }).then(() => {
      wirePersistenceRuntime()
      bootstrapped = true
    })
  }
  return bootstrapping
}

export function resetPersistenceBootstrapForTests(): void {
  bootstrapped = false
  bootstrapping = null
  resetPersistenceRuntimeWireForTests()
  resetOutboxHandlersLoaderForTests()
  resetOutboxHandlerDepsForTests()
  resetOutboxFlushForTests()
}
