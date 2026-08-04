#!/usr/bin/env node
/**
 * Phase 7 Module 1 — Finance Integration validation.
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

console.log('=== Phase 7 Module 1 — Finance Integration Validation ===\n')

const files = [
  'src/domain/finance-integration/finance-integration.types.ts',
  'src/domain/finance-integration/finance-integration-crud.service.ts',
  'src/domain/finance-integration/finance-integration-query.service.ts',
  'src/domain/ports/persistence/aggregates/accounting-integration.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/accounting-integration.in-memory.repository.ts',
  'src/application/finance-integration/finance-integration.dto.ts',
  'src/application/finance-integration/finance-integration-command.mapper.ts',
  'src/application/finance-integration/finance-integration.application-service.ts',
  'src/application/finance-integration/finance-integration-permission.guard.ts',
  'src/application/finance-integration/use-finance-integration.ts',
  'src/modules/finance-integration/layout/FinanceIntegrationLayout.tsx',
  'src/modules/finance-integration/pages/FinanceIntegrationPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/finance-integration/finance-integration-crud.service.ts')
const types = read('src/domain/finance-integration/finance-integration.types.ts')
const guard = read('src/application/finance-integration/finance-integration-permission.guard.ts')
const cmd = read('src/application/finance-integration/finance-integration-command.mapper.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/finance-integration/pages/FinanceIntegrationPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const twinTypes = read('src/domain/brain/twin/types.ts')
const query = read('src/domain/finance-integration/finance-integration-query.service.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')

check(uow.includes('accountingIntegrations'), 'UoW: accountingIntegrations port')
check(types.includes('AccountingIntegration'), 'Domain: AccountingIntegration')
check(types.includes('JournalEntry'), 'Domain: JournalEntry')
check(types.includes('JournalLine'), 'Domain: JournalLine')
check(types.includes('PostingBatchStatus'), 'Domain: PostingBatch')
check(types.includes('GLAccountMapping'), 'Domain: GLAccountMapping')
check(types.includes('FinancialPeriod'), 'Domain: FinancialPeriod')
check(types.includes('ProductionComplete'), 'Source: ProductionComplete')
check(types.includes('FinishedGoodsReceipt'), 'Source: FinishedGoodsReceipt')
check(types.includes('ShipmentDeparted'), 'Source: ShipmentDeparted')
check(types.includes('CommercialInvoiceIssued'), 'Source: CommercialInvoiceIssued')
check(types.includes('PurchaseReceipt'), 'Source: PurchaseReceipt')
check(types.includes('PurchaseInvoice'), 'Source: PurchaseInvoice')
check(types.includes('InventoryAdjustment'), 'Source: InventoryAdjustment')
check(types.includes('CostClosing'), 'Source: CostClosing')
check(crud.includes('assertBalanced'), 'Rule: double-entry balance')
check(crud.includes('Closed financial period rejects'), 'Rule: closed period reject')
check(crud.includes('idempotencyKey'), 'Rule: idempotent')
check(crud.includes('persistReverseBatch'), 'Rule: reversible')
check(crud.includes('logAudit'), 'Rule: auditable')
check(crud.includes('scheduleSalesOrderChange'), 'Outbox')
check(crud.includes('queryAllProductionOrders'), 'Reuse: production')
check(crud.includes('queryAllStockMovements'), 'Reuse: inventory')
check(crud.includes('queryAllExportShipments'), 'Reuse: export logistics')
check(crud.includes('queryAllExportDocumentSets'), 'Reuse: commercial docs')
check(crud.includes('queryAllGoodsReceipts'), 'Reuse: goods receipt')
check(crud.includes('queryAllPurchaseOrders'), 'Reuse: purchasing')
check(crud.includes('queryAllProductCards'), 'Reuse: cost sheet/product')
check(guard.includes('finance.write'), 'IAM: finance.write assert')
check(cmd.includes('runFinanceWriteCommand'), 'App: write guard')
check(query.includes('queryFinanceIntegrationBrainReadModel'), 'AI: brain model')
check(crud.includes('computeCostAnomalyScore'), 'AI: cost anomaly')
check(crud.includes('computeProfitabilityHint'), 'AI: profitability')
check(twinTypes.includes('ACCOUNTING_INTEGRATION'), 'Twin: type')
check(twin.includes('ACCOUNTING_INTEGRATION'), 'Twin: nodes')
check(keys.includes('financeIntegration'), 'Query keys')
check(ui.includes('Posting Queue') || ui.includes('PostingQueue'), 'UI: queue')
check(ui.includes('Posting Result') || ui.includes('PostingResult'), 'UI: results')
check(ui.includes('Failed Posting') || ui.includes('FailedPosting'), 'UI: failed')
check(ui.includes('Financial Timeline') || ui.includes('Timeline'), 'UI: timeline')
check(ui.includes('GL Mapping'), 'UI: GL mapping')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('/finance-integration'), 'Router: module')
check(router.includes('queue/:batchId'), 'Router: detail')
check(nav.includes('/finance-integration'), 'Nav')
check(iam.includes('finance.read'), 'IAM: finance.read')
check(iam.includes('finance.write'), 'IAM: finance.write')
check(startup.includes(':batchId'), 'Startup mapped')
check(pkg.includes('validate:finance-integration'), 'Build pipeline')
check(exists('../docs/architecture/FINANCE-INTEGRATION-REPORT.md'), 'Docs: report')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
