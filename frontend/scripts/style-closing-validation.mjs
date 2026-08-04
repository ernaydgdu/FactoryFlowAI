#!/usr/bin/env node
/**
 * Phase 7 Module 3 — Style Closing validation.
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

console.log('=== Phase 7 Module 3 — Style Closing Validation ===\n')

const files = [
  'src/domain/style-closing/style-closing.types.ts',
  'src/domain/style-closing/style-closing-crud.service.ts',
  'src/domain/style-closing/style-closing-query.service.ts',
  'src/domain/ports/persistence/aggregates/style-closing.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/style-closing.in-memory.repository.ts',
  'src/application/style-closing/style-closing.dto.ts',
  'src/application/style-closing/style-closing-command.mapper.ts',
  'src/application/style-closing/style-closing.application-service.ts',
  'src/application/style-closing/style-closing-permission.guard.ts',
  'src/application/style-closing/use-style-closing.ts',
  'src/modules/style-closing/layout/StyleClosingLayout.tsx',
  'src/modules/style-closing/pages/StyleClosingPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/style-closing/style-closing-crud.service.ts')
const types = read('src/domain/style-closing/style-closing.types.ts')
const guard = read('src/application/style-closing/style-closing-permission.guard.ts')
const cmd = read('src/application/style-closing/style-closing-command.mapper.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/style-closing/pages/StyleClosingPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const twinTypes = read('src/domain/brain/twin/types.ts')
const query = read('src/domain/style-closing/style-closing-query.service.ts')
const platform = read('src/domain/platform/types.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')

check(uow.includes('styleClosings'), 'UoW: styleClosings port')
check(types.includes('StyleClosing'), 'Domain: StyleClosing')
check(types.includes('CompletionChecklist'), 'Domain: checklist')
check(types.includes('MissingRequirement'), 'Domain: MissingRequirement')
check(types.includes('StyleKpiSnapshot'), 'Domain: KPI snapshot')
check(types.includes('FinalMargin'), 'Domain: FinalMargin')
check(types.includes('Open'), 'Lifecycle: Open')
check(types.includes('Checking'), 'Lifecycle: Checking')
check(types.includes('Ready'), 'Lifecycle: Ready')
check(types.includes('Approved'), 'Lifecycle: Approved')
check(types.includes('Closed'), 'Lifecycle: Closed')
check(crud.includes('evaluateStyleChecklist'), 'Checklist evaluate')
check(crud.includes('ALL_SALES_ORDERS_COMPLETED'), 'Gate: SO')
check(crud.includes('ALL_PRODUCTION_ORDERS_CLOSED'), 'Gate: production')
check(crud.includes('ALL_PURCHASE_ORDERS_CLOSED'), 'Gate: purchasing')
check(crud.includes('MRP_COMPLETED'), 'Gate: MRP')
check(crud.includes('INVENTORY_RECONCILED'), 'Gate: inventory')
check(crud.includes('WAREHOUSE_RECONCILED'), 'Gate: warehouse')
check(crud.includes('QUALITY_APPROVED'), 'Gate: quality')
check(crud.includes('SHIPMENTS_COMPLETED'), 'Gate: shipment')
check(crud.includes('COMMERCIAL_DOCS_ISSUED'), 'Gate: commercial')
check(crud.includes('ACCOUNTING_POSTINGS_COMPLETE'), 'Gate: accounting')
check(crud.includes('COST_CLOSING_APPROVED'), 'Gate: cost closing')
check(crud.includes('NO_OPEN_NCR'), 'Gate: NCR')
check(crud.includes('NO_PENDING_RESERVATIONS'), 'Gate: reservations')
check(crud.includes('NO_OPEN_WORK_ORDERS'), 'Gate: work orders')
check(crud.includes('immutable'), 'Rule: closed immutable')
check(crud.includes('idempotencyKey'), 'Rule: idempotent')
check(crud.includes('logAudit'), 'Audit')
check(crud.includes('submitForApproval'), 'Approval')
check(crud.includes('queryAllCostClosings'), 'Reuse: cost closing')
check(crud.includes('queryAllAccountingIntegrations'), 'Reuse: finance')
check(crud.includes('queryAllSalesOrders'), 'Reuse: sales')
check(crud.includes('queryLatestMrpRun'), 'Reuse: MRP')
check(crud.includes('queryAllPurchaseOrders'), 'Reuse: purchasing')
check(crud.includes('queryAllProductionOrders'), 'Reuse: production')
check(crud.includes('listNcrRecords'), 'Reuse: quality')
check(crud.includes('queryAllShipments'), 'Reuse: shipment')
check(guard.includes('style.close'), 'IAM: style.close')
check(cmd.includes('runStyleClosingWriteCommand'), 'App: write guard')
check(iam.includes('style.close'), 'IAM policy: style.close')
check(query.includes('queryStyleClosingBrainReadModel'), 'AI: brain')
check(crud.includes('computeStyleAnomalyScore'), 'AI: anomaly')
check(crud.includes('computeStyleProfitabilityHint'), 'AI: profitability')
check(twinTypes.includes('STYLE_CLOSING'), 'Twin: type')
check(twin.includes('STYLE_CLOSING'), 'Twin: nodes')
check(platform.includes('StyleClosing'), 'ApprovalWorkflowType')
check(keys.includes('styleClosing'), 'Query keys')
check(ui.includes('Style Closing Dashboard'), 'UI: dashboard')
check(ui.includes('Completion Checklist'), 'UI: checklist')
check(ui.includes('Missing Requirements'), 'UI: missing')
check(ui.includes('Approval Timeline'), 'UI: approval')
check(ui.includes('Historical Closings'), 'UI: history')
check(ui.includes('Final KPI Summary'), 'UI: KPI')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('/style-closing'), 'Router: module')
check(router.includes('batches/:styleClosingId'), 'Router: detail')
check(nav.includes('/style-closing'), 'Nav')
check(startup.includes(':styleClosingId'), 'Startup mapped')
check(pkg.includes('validate:style-closing'), 'Build pipeline')
check(exists('../docs/architecture/STYLE-CLOSING-REPORT.md'), 'Docs: report')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
