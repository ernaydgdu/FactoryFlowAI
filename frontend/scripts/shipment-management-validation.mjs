#!/usr/bin/env node
/**
 * Phase 6 Module 1 — Shipment Management validation.
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

console.log('=== Phase 6 Module 1 — Shipment Management Validation ===\n')

const files = [
  'src/domain/shipment/shipment.types.ts',
  'src/domain/shipment/shipment-crud.service.ts',
  'src/domain/shipment/shipment-query.service.ts',
  'src/domain/ports/persistence/aggregates/shipment.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/shipment.in-memory.repository.ts',
  'src/application/shipment/shipment.dto.ts',
  'src/application/shipment/shipment.mapper.ts',
  'src/application/shipment/shipment-command.mapper.ts',
  'src/application/shipment/shipment.application-service.ts',
  'src/application/shipment/shipment-permission.guard.ts',
  'src/application/shipment/use-shipment.ts',
  'src/modules/shipping/layout/ShippingLayout.tsx',
  'src/modules/shipping/pages/ShippingPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/shipment/shipment-crud.service.ts')
const cmd = read('src/application/shipment/shipment-command.mapper.ts')
const guard = read('src/application/shipment/shipment-permission.guard.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/shipping/pages/ShippingPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const iam = read('src/domain/platform/iam/permission-policy.ts')

check(uow.includes('shipments'), 'UoW: shipments port')
check(crud.includes('persistCreateShipment'), 'Domain: create')
check(crud.includes('persistAddLoadFromPackingList'), 'Domain: load plan')
check(crud.includes('persistTransitionShipment'), 'Domain: status transition')
check(crud.includes('persistPostShipmentInventory'), 'Domain: inventory post')
check(crud.includes('persistShipment'), 'Domain: reuses persistShipment')
check(crud.includes('portOfLoading'), 'Domain: POL')
check(crud.includes('portOfDischarge'), 'Domain: POD')
check(crud.includes('vesselName'), 'Domain: vessel')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('scheduleSalesOrderChange'), 'Domain: outbox')
check(crud.includes('idempotencyKey'), 'Domain: idempotency')
check(guard.includes('shipping.write'), 'IAM: write assert')
check(cmd.includes('runShipmentWriteCommand'), 'App: write guard')
check(iam.includes("'shipping.write'"), 'IAM: shipping.write permission')
check(keys.includes('shipment:'), 'Query keys: shipment')
check(ui.includes('ShipmentDashboardPage'), 'UI: dashboard')
check(ui.includes('ShipmentListPage'), 'UI: list')
check(ui.includes('ShipmentDetailPage'), 'UI: detail')
check(ui.includes('ShipmentStationPage'), 'UI: station')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('ShippingLayout'), 'Router: layout')
check(router.includes('shipments/:shipmentId'), 'Router: detail param')
check(nav.includes('Shipments'), 'Nav: Shipments')
check(startup.includes("':shipmentId'"), 'Startup: shipmentId mapped')
check(pkg.includes('validate:shipment'), 'Build: validate:shipment in pipeline')
check(
  !exists('src/domain/ports/persistence/aggregates/shipment-line.repository.ts'),
  'No duplicate shipment-line aggregate port',
)

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
