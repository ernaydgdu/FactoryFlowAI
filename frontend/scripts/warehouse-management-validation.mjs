#!/usr/bin/env node
/**
 * Phase 4 Module 1 — Warehouse Management validation.
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

console.log('=== Phase 4 Module 1 — Warehouse Management Validation ===\n')

const requiredFiles = [
  'src/domain/inventory/warehouse-management.service.ts',
  'src/application/warehouse-management/warehouse-management.dto.ts',
  'src/application/warehouse-management/warehouse-management.mapper.ts',
  'src/application/warehouse-management/warehouse-management-command.mapper.ts',
  'src/application/warehouse-management/warehouse-management.application-service.ts',
  'src/application/warehouse-management/use-warehouse-management.ts',
  'src/pages/warehouse-management/WarehouseManagementPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const domainSvc = read('src/domain/inventory/warehouse-management.service.ts')
const crud = read('src/domain/inventory/stock-ledger-crud.service.ts')
const types = read('src/domain/inventory/inventory.types.ts')
const mapper = read('src/application/warehouse-management/warehouse-management.mapper.ts')
const cmdMapper = read('src/application/warehouse-management/warehouse-management-command.mapper.ts')
const appService = read('src/application/warehouse-management/warehouse-management.application-service.ts')
const hooks = read('src/application/warehouse-management/use-warehouse-management.ts')
const ui = read('src/pages/warehouse-management/WarehouseManagementPages.tsx')
const inventoryUi = read('src/pages/inventory/InventoryPages.tsx')
const router = read('src/app/router.tsx')
const navigation = read('src/config/navigation.ts')
const queryKeys = read('src/application/core/query-keys.ts')
const startupAudit = read('scripts/startup-audit.mjs')
const packageJson = read('package.json')

// Domain layer
check(domainSvc.includes('listWarehouseStockSummaries'), 'Domain: listWarehouseStockSummaries')
check(domainSvc.includes('getWarehouseDetail'), 'Domain: getWarehouseDetail')
check(domainSvc.includes('isFinishedGoodsWarehouse'), 'Domain: isFinishedGoodsWarehouse')
check(crud.includes('persistFinishedGoodsReceipt'), 'Domain: persistFinishedGoodsReceipt (mamul depo tanımı)')
check(crud.includes("'PRODUCTION_OUTPUT'"), 'Domain: PRODUCTION_OUTPUT movement type used')
check(types.includes('FinishedGoodsReceiptInput'), 'Domain type: FinishedGoodsReceiptInput')
check(types.includes('WarehouseStockSummary'), 'Domain type: WarehouseStockSummary')

// Repository layer — reuse of existing ports, no new persistence pattern
check(
  domainSvc.includes("from '@/domain/master-data'") && domainSvc.includes('warehouseRepository'),
  'Repository: reuses master-data warehouseRepository (P17)',
)
check(
  domainSvc.includes('queryStockLedgerByWarehouse') && domainSvc.includes('queryStockMovementsByWarehouse'),
  'Repository: reuses Stock Ledger query service (P14/P15) — no new port added',
)

// Application layer
check(mapper.includes('mapWarehouseSummaryList'), 'App: mapWarehouseSummaryList')
check(mapper.includes('mapWarehouseDetail'), 'App: mapWarehouseDetail')
check(mapper.includes('mapFinishedGoodsWarehouseOptions'), 'App: mapFinishedGoodsWarehouseOptions')
check(cmdMapper.includes('executeFinishedGoodsReceipt'), 'App: executeFinishedGoodsReceipt')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper used')
check(appService.includes('warehouseManagementApplicationService'), 'App: application service export')
check(hooks.includes('useWarehouseSummaryList'), 'Hook: useWarehouseSummaryList')
check(hooks.includes('useWarehouseDetail'), 'Hook: useWarehouseDetail')
check(hooks.includes('useFinishedGoodsReceiptMutation'), 'Hook: useFinishedGoodsReceiptMutation')
check(hooks.includes('invalidateQueries'), 'Hook: query invalidate on mutation')
check(queryKeys.includes('warehouseManagement:'), 'Query keys: warehouseManagement namespace')

// UI layer
check(ui.includes('export function WarehouseDetailPage'), 'UI: WarehouseDetailPage')
check(ui.includes('export function FinishedGoodsReceiptPage'), 'UI: FinishedGoodsReceiptPage')
check(inventoryUi.includes('/warehouse/${r.code}'), 'UI: warehouse list rows link to detail page')
check(inventoryUi.includes('/warehouse/fg-receipt'), 'UI: Mamül Kabul entry point on dashboard')
check(router.includes("'WarehouseDetailPage'"), 'Router: WarehouseDetailPage route wired')
check(router.includes("'FinishedGoodsReceiptPage'"), 'Router: FinishedGoodsReceiptPage route wired')
check(router.includes('/warehouse/:code'), 'Router: warehouse detail dynamic route')
check(router.includes('/warehouse/fg-receipt'), 'Router: FG receipt route')
check(navigation.includes('Mamül Kabul'), 'Navigation: Depo menu has Mamül Kabul entry')
check(startupAudit.includes("':code'"), 'Startup audit: :code param mapped for crawl coverage')

// Build pipeline
check(packageJson.includes('validate:warehouse-management'), 'Build: validate:warehouse-management in pipeline')

// Architecture Freeze guardrails — no new persistence port files introduced
check(
  !exists('src/domain/ports/persistence/aggregates/warehouse-management.repository.ts'),
  'Architecture Freeze: no new aggregate port invented for this module',
)

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
