import { registerUnitOfWorkFactory } from '@/domain/ports/persistence/persistence-registry'

import {
  beginBootstrapDiagnostics,
  finishBootstrapDiagnostics,
  resetBootstrapDiagnostics,
  runIsolatedBootstrapPhase,
} from './bootstrap-diagnostics'
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
    bootstrapping = (async () => {
      const backend = getPersistenceBackend()
      beginBootstrapDiagnostics(backend)

      try {
        await runIsolatedBootstrapPhase(
          'uow-factory',
          'Register UnitOfWork factory',
          () => {
            if (backend === 'postgres') {
              configurePostgresPool()
            }
            registerUnitOfWorkFactory(resolveUnitOfWorkFactory())
          },
          { isolate: false },
        )

        if (getPersistenceBackend() === 'memory') {
          // Seed phases are isolated — one failure must not white-screen the app.
          await runIsolatedBootstrapPhase('seed-master', 'Master data lookups', () =>
            ensureMasterDataLookupsSeeded(),
          )
          await runIsolatedBootstrapPhase('seed-platform', 'Platform seed', () =>
            ensurePlatformSeeded(),
          )
          await runIsolatedBootstrapPhase('seed-stock', 'Stock cards', () =>
            ensureStockCardsSeeded(),
          )
          await runIsolatedBootstrapPhase('seed-products', 'Product cards', () =>
            ensureProductCardsSeeded(),
          )
          await runIsolatedBootstrapPhase('seed-orders', 'Sales orders', () =>
            ensureSalesOrdersSeeded(),
          )
          await runIsolatedBootstrapPhase('seed-mrp', 'MRP runs', () => ensureMrpRunsSeeded())
          await runIsolatedBootstrapPhase('seed-inventory', 'Inventory', () =>
            ensureInventorySeeded(),
          )
          await runIsolatedBootstrapPhase('seed-users', 'User accounts', () =>
            ensureUserAccountsSeeded(),
          )
        } else {
          await runIsolatedBootstrapPhase(
            'seed-skip',
            'Memory seed skipped (postgres backend)',
            () => undefined,
          )
        }

        await runIsolatedBootstrapPhase(
          'wire-runtime',
          'Wire TX + outbox runtime',
          () => wirePersistenceRuntime(),
          { isolate: false },
        )

        bootstrapped = true
        finishBootstrapDiagnostics({ ready: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        finishBootstrapDiagnostics({ ready: false, fatalError: message })
        // Still mark bootstrapped=false so callers can retry; providers show diagnostics.
        throw err
      }
    })().catch((err) => {
      // Convert rejection into resolved degraded path for UI — providers handle diagnostics.
      bootstrapping = null
      throw err
    })
  }
  return bootstrapping
}

/**
 * Soft bootstrap for UI: never rejects; returns ready/degraded/failed via diagnostics.
 * Critical path failures still surface as ready=false.
 */
export async function ensurePersistenceBootstrappedSafe(): Promise<{
  ready: boolean
  degraded: boolean
}> {
  const { getBootstrapDiagnostics } = await import('./bootstrap-diagnostics')
  try {
    await ensurePersistenceBootstrapped()
    const snap = getBootstrapDiagnostics()
    return { ready: true, degraded: snap.overall === 'degraded' }
  } catch {
    // Attempt minimal wire so command path may still work if only seeds failed.
    try {
      if (!bootstrapped) {
        registerUnitOfWorkFactory(resolveUnitOfWorkFactory())
        await wirePersistenceRuntime()
        bootstrapped = true
        finishBootstrapDiagnostics({ ready: true, fatalError: null })
        return { ready: true, degraded: true }
      }
    } catch {
      /* keep failed */
    }
    return { ready: false, degraded: true }
  }
}

export function resetPersistenceBootstrapForTests(): void {
  bootstrapped = false
  bootstrapping = null
  resetBootstrapDiagnostics()
  resetPersistenceRuntimeWireForTests()
  resetOutboxHandlersLoaderForTests()
  resetOutboxHandlerDepsForTests()
  resetOutboxFlushForTests()
}
