#!/usr/bin/env node
/**
 * Sprint 7 — PostgreSQL adapter skeleton validation (static only).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PG_ROOT = path.join(ROOT, 'src/infrastructure/persistence/postgresql')

const results = []

function assert(name, condition, detail) {
  results.push({ name, pass: condition, detail })
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}: ${detail}`)
}

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function fileExists(rel) {
  return existsSync(path.join(ROOT, rel))
}

console.log('=== Sprint 7 PostgreSQL Skeleton Validation ===\n')

const requiredModules = [
  'src/infrastructure/persistence/persistence-backend.ts',
  'src/infrastructure/persistence/persistence-unit-of-work-factory.ts',
  'src/infrastructure/persistence/postgresql/index.ts',
  'src/infrastructure/persistence/postgresql/postgres-config.ts',
  'src/infrastructure/persistence/postgresql/postgres-connection-pool.ts',
  'src/infrastructure/persistence/postgresql/postgres-migration-runner.ts',
  'src/infrastructure/persistence/postgresql/postgres-transaction-context.ts',
  'src/infrastructure/persistence/postgresql/async-unit-of-work-wrapper.ts',
  'src/infrastructure/persistence/postgresql/postgres-unit-of-work-factory.ts',
  'src/infrastructure/persistence/postgresql/postgres-not-implemented.error.ts',
  'src/infrastructure/persistence/postgresql/outbox/postgres-outbox.repository.ts',
  'src/infrastructure/persistence/postgresql/lookups/postgres-master-data-lookup-registry.stub.ts',
  'src/infrastructure/persistence/postgresql/collections/postgres-collection-repository.stub.ts',
  'src/infrastructure/persistence/postgresql/streams/postgres-audit-log-stream.stub.ts',
]

for (const mod of requiredModules) {
  assert(`Module exists: ${path.basename(mod)}`, fileExists(mod), mod)
}

const backendSrc = read('src/infrastructure/persistence/persistence-backend.ts')
assert('7.8 backend flag default memory', backendSrc.includes("return 'memory'"), 'getPersistenceBackend defaults to memory')
assert('7.8 env keys', backendSrc.includes('PERSISTENCE_BACKEND'), 'PERSISTENCE_BACKEND env supported')

const resolverSrc = read('src/infrastructure/persistence/persistence-unit-of-work-factory.ts')
assert('7.8 resolver uses backend flag', resolverSrc.includes('getPersistenceBackend()'), 'resolveUnitOfWorkFactory branches on backend')

const bootstrapSrc = read('src/infrastructure/persistence/bootstrap.ts')
assert('Bootstrap uses resolver', bootstrapSrc.includes('resolveUnitOfWorkFactory()'), 'bootstrap registers resolved factory')
assert('Bootstrap skips memory seed for postgres', bootstrapSrc.includes("getPersistenceBackend() === 'memory'"), 'memory-only seed gate')

const pgIndex = read('src/infrastructure/persistence/postgresql/index.ts')
assert('7.1–7.8 module registry', pgIndex.includes('POSTGRES_ADAPTER_SPRINT_MODULES'), 'sprint module list exported')

const outboxSrc = read('src/infrastructure/persistence/postgresql/outbox/postgres-outbox.repository.ts')
assert('7.4 outbox implements port', outboxSrc.includes('implements IDomainEventOutboxRepository'), 'PostgresOutboxRepository implements port')

const asyncSrc = read('src/infrastructure/persistence/postgresql/async-unit-of-work-wrapper.ts')
assert('7.2 async wrapper', asyncSrc.includes('wrapUnitOfWorkFactoryAsync'), 'async wrapper exported')

const txSrc = read('src/infrastructure/persistence/postgresql/postgres-transaction-context.ts')
assert('7.3 TX context', txSrc.includes('postgresBeginTransaction'), 'TX skeleton exported')

// No pg driver dependency in skeleton phase
const pkg = JSON.parse(read('package.json'))
assert('No pg npm dependency yet', !('pg' in (pkg.dependencies ?? {})) && !('pg' in (pkg.devDependencies ?? {})), 'skeleton stays driver-free')

// Count TS files under postgresql/
function countTsFiles(dir) {
  let count = 0
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) count += countTsFiles(full)
    else if (full.endsWith('.ts')) count += 1
  }
  return count
}

assert('postgresql/ file count >= 12', countTsFiles(PG_ROOT) >= 12, `found ${countTsFiles(PG_ROOT)} files`)

const failed = results.filter((r) => !r.pass)
console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} PASS ===`)
if (failed.length > 0) {
  console.error('Failed:', failed.map((f) => f.name).join(', '))
  process.exit(1)
}
