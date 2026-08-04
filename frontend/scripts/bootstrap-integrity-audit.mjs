#!/usr/bin/env node
/**
 * Bootstrap integrity — idempotency + registry single-init.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  console.log('=== Bootstrap Integrity Audit ===\n')
  let pass = 0
  let fail = 0
  const check = (ok, label) => {
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
    if (ok) pass += 1
    else fail += 1
  }

  const bootstrapMod = await import('../src/infrastructure/persistence/bootstrap.ts')
  const registryMod = await import('../src/domain/ports/persistence/persistence-registry.ts')
  const storeMod = await import('../src/infrastructure/persistence/in-memory/in-memory-unit-of-work.ts')

  const { ensurePersistenceBootstrapped, resetPersistenceBootstrapForTests } = bootstrapMod
  const { requireUnitOfWork, resetPersistenceForTests } = registryMod
  const { inMemoryStoreRegistry } = storeMod

  resetPersistenceBootstrapForTests()
  resetPersistenceForTests()

  await ensurePersistenceBootstrapped()
  const uow1 = requireUnitOfWork()
  const counts1 = {
    salesOrders: inMemoryStoreRegistry.salesOrders.length,
    productCards: inMemoryStoreRegistry.productCards.length,
    mrpRuns: inMemoryStoreRegistry.mrpRuns.length,
    purchaseRequests: inMemoryStoreRegistry.purchaseRequests.length,
    purchaseOrders: inMemoryStoreRegistry.purchaseOrders.length,
    users: uow1.userAccounts.cursor('kepler-default', {}, { limit: 10 }).items.length,
  }

  await ensurePersistenceBootstrapped()
  await ensurePersistenceBootstrapped()
  const uow2 = requireUnitOfWork()
  const counts2 = {
    salesOrders: inMemoryStoreRegistry.salesOrders.length,
    productCards: inMemoryStoreRegistry.productCards.length,
    mrpRuns: inMemoryStoreRegistry.mrpRuns.length,
    purchaseRequests: inMemoryStoreRegistry.purchaseRequests.length,
    purchaseOrders: inMemoryStoreRegistry.purchaseOrders.length,
    users: uow2.userAccounts.cursor('kepler-default', {}, { limit: 10 }).items.length,
  }

  check(uow1 === uow2, 'Persistence registry: same UoW instance on re-bootstrap')
  check(JSON.stringify(counts1) === JSON.stringify(counts2), 'Seed idempotency: store counts unchanged on 2nd/3rd bootstrap')
  check(counts1.salesOrders > 0, 'Sales orders seeded')
  check(counts1.productCards > 0, 'Product cards seeded')
  check(counts1.mrpRuns > 0, 'MRP runs seeded')
  check(counts1.purchaseRequests > 0, 'Purchase requests seeded')
  check(counts1.purchaseOrders > 0, 'Purchase orders seeded')
  check(counts1.users >= 5, 'User accounts seeded')

  // lifecycle seed context — mrp field present in source
  const lifecycleSeed = await import('node:fs').then((fs) =>
    fs.readFileSync(path.join(__dirname, '../src/domain/production-order/lifecycle-seed.bootstrap.ts'), 'utf8'),
  )
  check(lifecycleSeed.includes('mrp: order.mrp'), 'Lifecycle seed: mrp context field present')

  console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
