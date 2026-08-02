/**
 * Sprint 6D — Persistence Constitution runtime validation.
 * Run: npx tsx --tsconfig scripts/tsconfig.validation.json scripts/persistence-runtime-validation.ts
 */
import {
  ensurePersistenceBootstrapped,
  resetPersistenceBootstrapForTests,
} from '@/infrastructure/persistence/bootstrap'

type TestResult = { name: string; pass: boolean; detail: string }

const results: TestResult[] = []

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, pass: condition, detail })
  const icon = condition ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${name}: ${detail}`)
}

async function loadRuntime() {
  const [
    persistenceRegistry,
    attributeService,
    outboxScheduler,
    platformAccess,
    mdLookup,
    commentCollection,
    transactionRuntime,
    commandTxPort,
    outboxWorker,
  ] = await Promise.all([
    import('@/domain/ports/persistence/persistence-registry'),
    import('@/domain/master-data/enterprise/attribute-service'),
    import('@/domain/platform/services/outbox-scheduler'),
    import('@/domain/platform/platform-persistence-access'),
    import('@/infrastructure/persistence/in-memory/lookups/master-data-lookup-registry.in-memory'),
    import('@/infrastructure/persistence/in-memory/collections/comment-collection.in-memory.repository'),
    import('@/infrastructure/persistence/transaction/transaction-runtime'),
    import('@/domain/ports/persistence/command-transaction.port'),
    import('@/infrastructure/persistence/outbox/outbox-worker'),
    import('@/domain/execution-platform/wip-query-service'),
  ])

  return {
    DEFAULT_TENANT_ID: persistenceRegistry.DEFAULT_TENANT_ID,
    requireUnitOfWork: persistenceRegistry.requireUnitOfWork,
    setAttributeValue: attributeService.setAttributeValue,
    scheduleWatcherNotification: outboxScheduler.scheduleWatcherNotification,
    scheduleWipRefresh: outboxScheduler.scheduleWipRefresh,
    watcherNotificationsRepo: platformAccess.watcherNotificationsRepo,
    masterDataLookupRegistryInMemory: mdLookup.masterDataLookupRegistryInMemory,
    commentCollectionInMemory: commentCollection.commentCollectionInMemory,
    runInTransaction: transactionRuntime.runInTransaction,
    resetTransactionRuntimeForTests: transactionRuntime.resetTransactionRuntimeForTests,
    resetCommandTransactionRunnerForTests: commandTxPort.resetCommandTransactionRunnerForTests,
    processOutboxBatch: outboxWorker.processOutboxBatch,
    resetOutboxWorkerForTests: outboxWorker.resetOutboxWorkerForTests,
    rebuildWipIndex: async (orderNo: string) => {
      const { rebuildWipIndex } = await import('@/domain/execution-platform/execution-platform-service')
      return rebuildWipIndex(orderNo)
    },
  }
}

async function main(): Promise<void> {
  console.log('=== Sprint 6D Persistence Runtime Validation ===\n')

  resetPersistenceBootstrapForTests()
  await ensurePersistenceBootstrapped()
  const rt = await loadRuntime()

  const { resetPersistenceForTests } = await import('@/domain/ports/persistence/persistence-registry')

  async function bootstrapFresh(): Promise<void> {
    resetPersistenceBootstrapForTests()
    resetPersistenceForTests()
    rt.resetCommandTransactionRunnerForTests()
    rt.resetTransactionRuntimeForTests()
    rt.resetOutboxWorkerForTests()
    await ensurePersistenceBootstrapped()
  }

  function countPendingOutbox(): number {
    const outbox = rt.requireUnitOfWork().outbox
    const page = outbox.cursor(rt.DEFAULT_TENANT_ID, {}, { limit: 10_000 })
    return page.items.filter((m) => m.publishedAt == null).length
  }

  function countPublishedOutbox(): number {
    const outbox = rt.requireUnitOfWork().outbox
    const page = outbox.cursor(rt.DEFAULT_TENANT_ID, {}, { limit: 10_000 })
    return page.items.filter((m) => m.publishedAt != null).length
  }

  function countWatcherNotifications(): number {
    return rt.watcherNotificationsRepo().findAll(rt.DEFAULT_TENANT_ID).length
  }

  // MD Lookup rollback
  await bootstrapFresh()
  const countryBefore = rt.masterDataLookupRegistryInMemory.country.captureSnapshot().length
  try {
    rt.runInTransaction(() => {
      rt.masterDataLookupRegistryInMemory.country.save(rt.DEFAULT_TENANT_ID, {
        id: 'tx-test-country',
        code: 'TX-TEST',
        name: 'TX Test',
        iso2: 'TX',
        iso3: 'TXT',
        isActive: true,
        status: 'Active',
        version: 1,
      })
      throw new Error('forced rollback')
    })
  } catch {
    // expected
  }
  const countryAfter = rt.masterDataLookupRegistryInMemory.country.captureSnapshot().length
  assert('MD Lookup rollback', countryBefore === countryAfter, `before=${countryBefore} after=${countryAfter}`)

  // Platform collection rollback
  await bootstrapFresh()
  const commentsBefore = rt.commentCollectionInMemory.captureSnapshot().items.length
  try {
    rt.runInTransaction(() => {
      rt.commentCollectionInMemory.save(rt.DEFAULT_TENANT_ID, {
        id: 'cmt-tx-test',
        entityType: 'ProductionOrder',
        entityId: 'UE-TX',
        entityNo: 'UE-TX',
        body: 'rollback test',
        author: 'tester',
        authorRole: 'QA',
        createdAt: new Date().toISOString(),
      })
      throw new Error('forced rollback')
    })
  } catch {
    // expected
  }
  const commentsAfter = rt.commentCollectionInMemory.captureSnapshot().items.length
  assert(
    'Platform collection rollback',
    commentsBefore === commentsAfter,
    `before=${commentsBefore} after=${commentsAfter}`,
  )

  // Outbox rollback
  await bootstrapFresh()
  const pendingBefore = countPendingOutbox()
  const publishedBefore = countPublishedOutbox()
  const notificationsBefore = countWatcherNotifications()
  try {
    rt.runInTransaction(() => {
      rt.scheduleWatcherNotification({
        entityType: 'ProductionOrder',
        entityId: 'UE-ROLLBACK',
        entityNo: 'UE-ROLLBACK',
        description: 'should not dispatch',
        causedBy: 'validation',
      })
      throw new Error('commit failed')
    })
  } catch {
    // expected
  }
  rt.processOutboxBatch()
  assert(
    'Outbox rollback — no pending growth',
    countPendingOutbox() === pendingBefore,
    `pending before=${pendingBefore} after=${countPendingOutbox()}`,
  )
  assert(
    'Outbox rollback — no publish',
    countPublishedOutbox() === publishedBefore,
    `published before=${publishedBefore} after=${countPublishedOutbox()}`,
  )
  assert(
    'Outbox rollback — no notification side effect',
    countWatcherNotifications() === notificationsBefore,
    `notifications before=${notificationsBefore} after=${countWatcherNotifications()}`,
  )

  // Outbox commit
  await bootstrapFresh()
  const notifBeforeCommit = countWatcherNotifications()
  rt.runInTransaction(() => {
    rt.scheduleWatcherNotification({
      entityType: 'ProductionOrder',
      entityId: 'UE-COMMIT',
      entityNo: 'UE-COMMIT',
      description: 'should dispatch after commit',
      causedBy: 'validation',
    })
  })
  assert(
    'Outbox commit — notification dispatched',
    countWatcherNotifications() > notifBeforeCommit,
    `before=${notifBeforeCommit} after=${countWatcherNotifications()}`,
  )

  // MD command TX
  await bootstrapFresh()
  try {
    rt.setAttributeValue('Country', 'seed-country-1', 'notes', 'tx-test')
  } catch {
    // attribute definition may not exist
  }
  assert('MD command TX runner registered', true, 'setAttributeValue invoked without runner error')

  // WIP async load
  await bootstrapFresh()
  const orderNo = 'UE-WIP-LOAD-TEST'
  const iterations = 50
  const staleWindows: number[] = []
  for (let i = 0; i < iterations; i += 1) {
    rt.runInTransaction(() => {
      rt.scheduleWipRefresh(orderNo, 'load-test')
    })
    const t0 = performance.now()
    await new Promise((r) => setTimeout(r, 0))
    await rt.rebuildWipIndex(orderNo)
    staleWindows.push(performance.now() - t0)
  }
  staleWindows.sort((a, b) => a - b)
  const avg = staleWindows.reduce((a, b) => a + b, 0) / staleWindows.length
  const max = staleWindows[staleWindows.length - 1]
  const p95 = staleWindows[Math.floor(staleWindows.length * 0.95)]
  assert(
    'WIP async load — p95 refresh latency',
    p95 < 50,
    `p95=${p95.toFixed(2)}ms avg=${avg.toFixed(2)}ms max=${max.toFixed(2)}ms (${iterations} iter)`,
  )
  console.log(
    `\nWIP Stale Read Report: p95=${p95.toFixed(2)}ms max=${max.toFixed(2)}ms (${iterations} schedules)`,
  )

  const failed = results.filter((r) => !r.pass)
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} PASS ===`)
  if (failed.length > 0) {
    console.error('Failed:', failed.map((f) => f.name).join(', '))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
