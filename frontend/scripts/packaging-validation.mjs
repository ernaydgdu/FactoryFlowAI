#!/usr/bin/env node
/**
 * Phase 5 Module 4 — Packaging & Packing List validation.
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

console.log('=== Phase 5 Module 4 — Packaging & Packing List Validation ===\n')

const files = [
  'src/domain/packaging/packaging.types.ts',
  'src/domain/packaging/packing-list-crud.service.ts',
  'src/domain/packaging/packing-list-query.service.ts',
  'src/domain/ports/persistence/aggregates/packing-list.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/packing-list.in-memory.repository.ts',
  'src/application/packaging/packaging.dto.ts',
  'src/application/packaging/packaging.mapper.ts',
  'src/application/packaging/packaging-command.mapper.ts',
  'src/application/packaging/packaging.application-service.ts',
  'src/application/packaging/use-packaging.ts',
  'src/modules/packaging/layout/PackagingLayout.tsx',
  'src/modules/packaging/pages/PackagingPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/packaging/packing-list-crud.service.ts')
const cmd = read('src/application/packaging/packaging-command.mapper.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/packaging/pages/PackagingPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')

check(uow.includes('packingLists'), 'UoW: packingLists port')
check(crud.includes('persistCreatePackingList'), 'Domain: create PL')
check(crud.includes('persistAddPackage'), 'Domain: add package')
check(crud.includes('prepareSscc'), 'Domain: SSCC preparation')
check(crud.includes('calculateVolumeCbm'), 'Domain: volume CBM')
check(crud.includes('calculateGrossWeight'), 'Domain: weight')
check(crud.includes('validatePackingListAgainstOrder'), 'Domain: package validation')
check(crud.includes('persistAutoGenerateFromFinishedGoods'), 'Domain: auto from FG')
check(crud.includes('persistBindShipment'), 'Domain: shipment binding')
check(crud.includes('persistShipment'), 'Domain: reuses persistShipment')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleSalesOrderChange'), 'Domain: outbox')
check(crud.includes('idempotencyKey'), 'Domain: idempotency')
check(cmd.includes('runCommandInTransaction'), 'App: TX wrapper')
check(cmd.includes('executeCreatePackingList'), 'App: create')
check(cmd.includes('executeBindShipment'), 'App: bind shipment')
check(cmd.includes('executeAutoGenerateFromFg'), 'App: auto FG')
check(keys.includes('packaging:'), 'Query keys: packaging')
check(ui.includes('export function PackagingDashboardPage'), 'UI: dashboard')
check(ui.includes('export function PackingListPage'), 'UI: lists')
check(ui.includes('export function PackingListDetailPage'), 'UI: detail')
check(ui.includes('export function PackingStationPage'), 'UI: station')
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
