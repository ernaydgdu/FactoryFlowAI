#!/usr/bin/env node
/**
 * Phase 7 Module 2 — Cost Closing validation.
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

console.log('=== Phase 7 Module 2 — Cost Closing Validation ===\n')

const files = [
  'src/domain/cost-closing/cost-closing.types.ts',
  'src/domain/cost-closing/cost-closing-crud.service.ts',
  'src/domain/cost-closing/cost-closing-query.service.ts',
  'src/domain/ports/persistence/aggregates/cost-closing.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/cost-closing.in-memory.repository.ts',
  'src/application/cost-closing/cost-closing.dto.ts',
  'src/application/cost-closing/cost-closing-command.mapper.ts',
  'src/application/cost-closing/cost-closing.application-service.ts',
  'src/application/cost-closing/cost-closing-permission.guard.ts',
  'src/application/cost-closing/use-cost-closing.ts',
  'src/modules/cost-closing/layout/CostClosingLayout.tsx',
  'src/modules/cost-closing/pages/CostClosingPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/cost-closing/cost-closing-crud.service.ts')
const types = read('src/domain/cost-closing/cost-closing.types.ts')
const guard = read('src/application/cost-closing/cost-closing-permission.guard.ts')
const cmd = read('src/application/cost-closing/cost-closing-command.mapper.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/cost-closing/pages/CostClosingPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const twinTypes = read('src/domain/brain/twin/types.ts')
const query = read('src/domain/cost-closing/cost-closing-query.service.ts')
const platform = read('src/domain/platform/types.ts')

check(uow.includes('costClosings'), 'UoW: costClosings port')
check(types.includes('CostClosing'), 'Domain: CostClosing')
check(types.includes('CostVariance'), 'Domain: variances')
check(types.includes('InventoryRevaluation'), 'Domain: InventoryRevaluation')
check(types.includes('FinancialReconciliation'), 'Domain: FinancialReconciliation')
check(types.includes('Open'), 'Lifecycle: Open')
check(types.includes('Calculating'), 'Lifecycle: Calculating')
check(types.includes('Reconciling'), 'Lifecycle: Reconciling')
check(types.includes('Approved'), 'Lifecycle: Approved')
check(types.includes('Closed'), 'Lifecycle: Closed')
check(crud.includes('evaluateCostClosingGates'), 'Gates: evaluate')
check(crud.includes('PRODUCTION_COMPLETED'), 'Gate: production')
check(crud.includes('FINISHED_GOODS_RECEIVED'), 'Gate: FG')
check(crud.includes('SHIPMENT_COMPLETED'), 'Gate: shipment')
check(crud.includes('COMMERCIAL_DOCS_ISSUED'), 'Gate: commercial docs')
check(crud.includes('ACCOUNTING_POSTINGS_COMPLETED'), 'Gate: accounting')
check(crud.includes('INVENTORY_RECONCILIATION'), 'Gate: inventory')
check(crud.includes('NO_OPEN_PRODUCTION_ORDERS'), 'Gate: no open PO')
check(crud.includes('NO_OPEN_PURCHASE_RECEIPTS'), 'Gate: no open GR')
check(crud.includes('immutable'), 'Rule: closed immutable')
check(crud.includes('Reversible only until Approved'), 'Rule: reverse until Approved')
check(crud.includes('idempotencyKey'), 'Rule: idempotent')
check(crud.includes('submitForApproval'), 'Approval workflow')
check(crud.includes('logAudit'), 'Audit')
check(crud.includes('scheduleSalesOrderChange'), 'Outbox')
check(crud.includes('queryAllAccountingIntegrations'), 'Reuse: finance')
check(crud.includes('queryAllProductionOrders'), 'Reuse: production')
check(crud.includes('queryAllShipments'), 'Reuse: shipment')
check(crud.includes('queryAllExportDocumentSets'), 'Reuse: commercial')
check(crud.includes('queryAllGoodsReceipts'), 'Reuse: purchasing/GR')
check(crud.includes('queryAllStockMovements'), 'Reuse: inventory')
check(guard.includes('finance.write'), 'IAM: finance.write')
check(cmd.includes('runCostClosingWriteCommand'), 'App: write guard')
check(query.includes('queryCostClosingBrainReadModel'), 'AI: brain')
check(crud.includes('computeAnomalyScore'), 'AI: anomaly')
check(crud.includes('computeProfitabilityHint'), 'AI: profitability')
check(twinTypes.includes('COST_CLOSING'), 'Twin: type')
check(twin.includes('COST_CLOSING'), 'Twin: nodes')
check(platform.includes('CostClosing'), 'ApprovalWorkflowType: CostClosing')
check(keys.includes('costClosing'), 'Query keys')
check(ui.includes('Cost Closing Dashboard') || ui.includes('Dashboard'), 'UI: dashboard')
check(ui.includes('Variance Analysis'), 'UI: variance')
check(ui.includes('Reconciliation'), 'UI: reconciliation')
check(ui.includes('Approval Timeline'), 'UI: approval timeline')
check(ui.includes('Closing History'), 'UI: history')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('/cost-closing'), 'Router: module')
check(router.includes('batches/:costClosingId'), 'Router: detail')
check(nav.includes('/cost-closing'), 'Nav')
check(startup.includes(':costClosingId'), 'Startup mapped')
check(pkg.includes('validate:cost-closing'), 'Build pipeline')
check(exists('../docs/architecture/COST-CLOSING-REPORT.md'), 'Docs: report')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
