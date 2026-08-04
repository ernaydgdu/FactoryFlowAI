#!/usr/bin/env node
/**
 * Phase 5 Module 4 — Packaging & Packing List validation (+ hardening).
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

let pass = 0
let fail = 0

function check(ok, label) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (ok) pass += 1
  else fail += 1
}

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return existsSync(path.join(ROOT, rel))
}

console.log('=== Phase 5 Module 4 — Packaging Hardening Validation ===\n')

const files = [
  'src/domain/packaging/packaging.types.ts',
  'src/domain/packaging/packing-list-crud.service.ts',
  'src/domain/packaging/packing-list-query.service.ts',
  'src/domain/packaging/packaging-gs1.ts',
  'src/domain/packaging/packaging-documents.service.ts',
  'src/domain/ports/persistence/aggregates/packing-list.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/packing-list.in-memory.repository.ts',
  'src/infrastructure/persistence/postgresql/aggregates/packing-list.postgres.repository.ts',
  'src/application/packaging/packaging.dto.ts',
  'src/application/packaging/packaging.mapper.ts',
  'src/application/packaging/packaging-command.mapper.ts',
  'src/application/packaging/packaging.application-service.ts',
  'src/application/packaging/packaging-permission.guard.ts',
  'src/application/packaging/use-packaging.ts',
  'src/modules/packaging/layout/PackagingLayout.tsx',
  'src/modules/packaging/pages/PackagingPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/packaging/packing-list-crud.service.ts')
const cmd = read('src/application/packaging/packaging-command.mapper.ts')
const guard = read('src/application/packaging/packaging-permission.guard.ts')
const gs1 = read('src/domain/packaging/packaging-gs1.ts')
const docs = read('src/domain/packaging/packaging-documents.service.ts')
const query = read('src/domain/packaging/packing-list-query.service.ts')
const repo = read('src/domain/ports/persistence/aggregates/packing-list.repository.ts')
const mem = read('src/infrastructure/persistence/in-memory/aggregates/packing-list.in-memory.repository.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/packaging/pages/PackagingPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const seed = read('src/domain/master-data/enterprise/enterprise-seed.ts')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const hooks = read('src/application/packaging/use-packaging.ts')

check(uow.includes('packingLists'), 'UoW: packingLists port')
check(repo.includes('nextPackingListCounter'), 'Repo: PL counter')
check(repo.includes('nextSsccSerial'), 'Repo: SSCC serial')
check(mem.includes('nextPackingListCounter'), 'In-memory: PL counter')
check(mem.includes('nextSsccSerial'), 'In-memory: SSCC serial')
check(!crud.includes('limit: 5000'), 'Domain: no full-scan nextPlNo')
check(crud.includes('nextPackingListCounter'), 'Domain: uses repo PL sequence')
check(crud.includes('nextSsccSerial'), 'Domain: uses repo SSCC sequence')
check(gs1.includes('GS1_COMPANY_PREFIX'), 'GS1: Master Data attr')
check(gs1.includes('resolveAttributeMap'), 'GS1: resolveAttributeMap')
check(!crud.includes("companyPrefix = '0860123456'"), 'GS1: no hardcoded default in prepareSscc signature')
check(guard.includes('warehouse.write'), 'IAM: write assert')
check(cmd.includes('runPackagingWriteCommand'), 'App: write guard on commands')
check(iam.includes("'warehouse.write'"), 'IAM: warehouse.write permission')
check(seed.includes('GS1_COMPANY_PREFIX'), 'Seed: GS1 company prefix')
check(ui.includes('useAuth'), 'UI: IAM session actor')
check(!ui.includes("pilot-user"), 'UI: no hardcoded pilot-user')
check(hooks.includes('inventory.movements'), 'RQ: narrow inventory invalidation on bind')
check(hooks.includes('packaging.dashboard'), 'RQ: scoped packaging keys')
check(docs.includes('buildPackingListDocument'), 'Docs: PDF payload')
check(docs.includes('buildPackageGs1128Label'), 'Docs: GS1-128 label')
check(query.includes('queryPackagingBrainReadModel'), 'AI: brain read model')
check(crud.includes('persistSubmitPackingApproval'), 'P1: approval submit')
check(crud.includes('persistApprovePackingList'), 'P1: approval approve')
check(crud.includes('persistRevisePackingList'), 'P1: revision')
check(crud.includes('persistAssignContainer'), 'P1: container')
check(crud.includes('persistNestPackage'), 'P1: HU nest')
check(crud.includes('PackingListShipmentOrchestrated'), 'P1: shipment orchestration')
check(twin.includes("PACKING_LIST"), 'Twin: PACKING_LIST nodes')
check(exists('src/infrastructure/persistence/postgresql/aggregates/packing-list.postgres.repository.ts'), 'Postgres: packing-list repo')
check(keys.includes('brain:'), 'Query keys: brain')
check(router.includes('/packaging'), 'Router: packaging')
check(router.includes('lists/:packingListId'), 'Router: detail param')
check(nav.includes('Packing Lists'), 'Nav: Packing Lists')
check(startup.includes("':packingListId'"), 'Startup: packingListId mapped')
check(pkg.includes('validate:packaging'), 'Build: validate:packaging in pipeline')
check(
  !exists('src/domain/ports/persistence/aggregates/carton.repository.ts'),
  'No duplicate carton aggregate port (packages embedded)',
)

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
