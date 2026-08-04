#!/usr/bin/env node
/**
 * Phase 6 Module 3 — Export Logistics Orchestration validation.
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

console.log('=== Phase 6 Module 3 — Export Logistics Validation ===\n')

const files = [
  'src/domain/export-logistics/export-logistics.types.ts',
  'src/domain/export-logistics/export-logistics-crud.service.ts',
  'src/domain/export-logistics/export-logistics-query.service.ts',
  'src/domain/ports/persistence/aggregates/export-shipment.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/export-shipment.in-memory.repository.ts',
  'src/application/export-logistics/export-logistics.dto.ts',
  'src/application/export-logistics/export-logistics-command.mapper.ts',
  'src/application/export-logistics/export-logistics.application-service.ts',
  'src/application/export-logistics/export-logistics-permission.guard.ts',
  'src/application/export-logistics/use-export-logistics.ts',
  'src/modules/export-logistics/layout/ExportLogisticsLayout.tsx',
  'src/modules/export-logistics/pages/ExportLogisticsPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/export-logistics/export-logistics-crud.service.ts')
const cmd = read('src/application/export-logistics/export-logistics-command.mapper.ts')
const guard = read('src/application/export-logistics/export-logistics-permission.guard.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/export-logistics/pages/ExportLogisticsPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const query = read('src/domain/export-logistics/export-logistics-query.service.ts')

check(uow.includes('exportShipments'), 'UoW: exportShipments port')
check(crud.includes('persistCreateExportShipment'), 'Domain: create')
check(crud.includes('evaluateExportGates'), 'Domain: gate evaluation')
check(crud.includes('COMMERCIAL_INVOICE_ISSUED'), 'Gate: CI Issued')
check(crud.includes('PACKING_LIST_APPROVED'), 'Gate: PL Approved')
check(crud.includes('WEIGHT_RECONCILE'), 'Gate: weight')
check(crud.includes('CBM_RECONCILE'), 'Gate: CBM')
check(crud.includes('requireLoadGates'), 'Rule: load gates')
check(crud.includes('customs clearance'), 'Rule: depart after customs')
check(crud.includes('ALL_EXPORT_DOCS_ISSUED'), 'Rule: close docs')
check(crud.includes('computeDelayPrediction'), 'AI: delay prediction')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('scheduleSalesOrderChange'), 'Domain: outbox')
check(crud.includes('idempotencyKey'), 'Domain: idempotency')
check(crud.includes('queryShipmentById'), 'Reuse: Shipment')
check(crud.includes('queryPackingListById'), 'Reuse: Packaging')
check(crud.includes('queryAllExportDocumentSets'), 'Reuse: Commercial Docs')
check(guard.includes('shipping.write'), 'IAM: write assert')
check(cmd.includes('runExportLogisticsWriteCommand'), 'App: write guard')
check(query.includes('queryExportLogisticsBrainReadModel'), 'AI: brain model')
check(twin.includes('EXPORT_SHIPMENT'), 'Twin: EXPORT_SHIPMENT nodes')
check(keys.includes('exportLogistics'), 'Query keys')
check(ui.includes('ExportLogisticsDashboardPage'), 'UI: dashboard')
check(ui.includes('ExportShipmentBoardPage'), 'UI: board')
check(ui.includes('ExportDispatchWizardPage'), 'UI: dispatch')
check(ui.includes('Customs Timeline'), 'UI: customs timeline')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('export-logistics'), 'Router: module')
check(router.includes('board/:exportShipmentId'), 'Router: detail')
check(nav.includes('Export Logistics'), 'Nav')
check(startup.includes("':exportShipmentId'"), 'Startup mapped')
check(pkg.includes('validate:export-logistics'), 'Build pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
