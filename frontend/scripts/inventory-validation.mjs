#!/usr/bin/env node
/**
 * Phase 3 Module 4 — Inventory & Warehouse validation.
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

console.log('=== Phase 3 Module 4 — Inventory & Warehouse Validation ===\n')

const requiredFiles = [
  'src/domain/inventory/inventory.types.ts',
  'src/domain/inventory/stock-ledger-engine.service.ts',
  'src/domain/inventory/stock-ledger-crud.service.ts',
  'src/domain/inventory/stock-ledger-query.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/stock-ledger.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/streams/stock-movement.in-memory.stream.repository.ts',
  'src/infrastructure/persistence/in-memory/inventory-seed.bootstrap.ts',
  'src/application/inventory/inventory.dto.ts',
  'src/application/inventory/inventory.mapper.ts',
  'src/application/inventory/inventory-command.mapper.ts',
  'src/application/inventory/inventory.application-service.ts',
  'src/application/inventory/use-inventory.ts',
  'src/pages/inventory/InventoryPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const crud = read('src/domain/inventory/stock-ledger-crud.service.ts')
const query = read('src/domain/inventory/stock-ledger-query.service.ts')
const cmdMapper = read('src/application/inventory/inventory-command.mapper.ts')
const useHooks = read('src/application/inventory/use-inventory.ts')
const uow = read('src/infrastructure/persistence/in-memory/in-memory-unit-of-work.ts')
const store = read('src/infrastructure/persistence/in-memory/store-registry.ts')
const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')
const grCrud = read('src/domain/purchasing/goods-receipt-crud.service.ts')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const ui = read('src/pages/inventory/InventoryPages.tsx')
const packageJson = read('package.json')
const queryKeys = read('src/application/core/query-keys.ts')

check(crud.includes('persistGoodsReceiptToLedger'), 'Domain: persistGoodsReceiptToLedger')
check(crud.includes('persistGoodsIssue'), 'Domain: persistGoodsIssue')
check(crud.includes('persistStockTransfer'), 'Domain: persistStockTransfer')
check(crud.includes('persistReservation'), 'Domain: persistReservation')
check(crud.includes('persistStockAdjustment'), 'Domain: persistStockAdjustment')
check(crud.includes('persistCycleCount'), 'Domain: persistCycleCount')
check(crud.includes('scheduleInventoryChange'), 'Domain: scheduleInventoryChange')
check(crud.includes('logAudit'), 'Domain: audit on movement')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline on movement')
check(query.includes('queryAllStockMovements'), 'Domain query: movements')
check(query.includes('queryAllBalances'), 'Domain query: balances')
check(cmdMapper.includes('executeGoodsReceipt'), 'App: executeGoodsReceipt')
check(cmdMapper.includes('executeGoodsIssue'), 'App: executeGoodsIssue')
check(cmdMapper.includes('executeTransfer'), 'App: executeTransfer')
check(cmdMapper.includes('executeReservation'), 'App: executeReservation')
check(cmdMapper.includes('executeAdjustment'), 'App: executeAdjustment')
check(cmdMapper.includes('executeCycleCount'), 'App: executeCycleCount')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(useHooks.includes('useGoodsReceiptMutation'), 'Hook: goods receipt mutation')
check(useHooks.includes('useGoodsIssueMutation'), 'Hook: goods issue mutation')
check(useHooks.includes('useTransferMutation'), 'Hook: transfer mutation')
check(useHooks.includes('useReservationMutation'), 'Hook: reservation mutation')
check(useHooks.includes('useCycleCountMutation'), 'Hook: cycle count mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(uow.includes('StockLedgerInMemoryRepository(inMemoryStoreRegistry)'), 'UoW: stock ledger repo wired')
check(uow.includes('StockMovementInMemoryStreamRepository(inMemoryStoreRegistry)'), 'UoW: movement stream wired')
check(store.includes('stockLedgers:'), 'Store: stockLedgers array')
check(store.includes('stockMovements:'), 'Store: stockMovements array')
check(bootstrap.includes('ensureInventorySeeded'), 'Bootstrap: inventory seed')
check(grCrud.includes('persistGoodsReceiptToLedger'), 'Purchasing GR → inventory ledger')
check(outbox.includes('scheduleInventoryChange'), 'Outbox: InventoryChanged event')
check(queryKeys.includes('inventory:'), 'Query keys: inventory namespace')
check(ui.includes('useInventoryBalanceList'), 'UI: repository-backed balance list')
check(ui.includes('useInventoryMovementList'), 'UI: repository-backed movement list')
check(ui.includes('useGoodsReceiptMutation'), 'UI: GR mutation')
check(!ui.includes('STOCK_CARDS'), 'UI: no mock STOCK_CARDS')
check(packageJson.includes('validate:inventory'), 'Build: validate:inventory in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
