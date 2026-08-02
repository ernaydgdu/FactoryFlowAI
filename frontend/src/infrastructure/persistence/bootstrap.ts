import { registerUnitOfWorkFactory } from '@/domain/ports/persistence/persistence-registry'

import { wirePersistenceRuntime, resetPersistenceRuntimeWireForTests } from './bootstrap-runtime'
import { InMemoryUnitOfWorkFactory } from './in-memory/in-memory-unit-of-work'
import { ensureMasterDataLookupsSeeded } from './in-memory/master-data-seed.bootstrap'
import { ensurePlatformSeeded } from './in-memory/platform-seed.bootstrap'
import { resetOutboxHandlerDepsForTests } from './outbox/outbox-handlers'
import { resetOutboxHandlersLoaderForTests } from './outbox/outbox-handlers-loader'
import { resetOutboxFlushForTests } from './transaction/transaction-runtime'

let bootstrapped = false
let bootstrapping: Promise<void> | null = null

export function ensurePersistenceBootstrapped(): Promise<void> {
  if (bootstrapped) return Promise.resolve()
  if (!bootstrapping) {
    bootstrapping = Promise.resolve().then(() => {
      registerUnitOfWorkFactory(new InMemoryUnitOfWorkFactory())
      ensureMasterDataLookupsSeeded()
      ensurePlatformSeeded()
      return wirePersistenceRuntime()
    }).then(() => {
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
