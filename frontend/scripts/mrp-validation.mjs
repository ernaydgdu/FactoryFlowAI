#!/usr/bin/env node
/**
 * Phase 3 Module 2 — MRP validation.
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

console.log('=== Phase 3 Module 2 — MRP Validation ===\n')

const requiredFiles = [
  'src/domain/mrp/mrp.types.ts',
  'src/domain/mrp/mrp-lifecycle.types.ts',
  'src/domain/mrp/mrp-engine.service.ts',
  'src/domain/mrp/mrp-explosion.service.ts',
  'src/domain/mrp/mrp-stock-policy.service.ts',
  'src/domain/mrp/mrp-snapshot.service.ts',
  'src/domain/mrp/mrp-crud.service.ts',
  'src/domain/mrp/mrp-query.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/mrp-run.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/purchase-order.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/mrp-seed.bootstrap.ts',
  'src/application/mrp/mrp-command.mapper.ts',
  'src/application/mrp/mrp.application-service.ts',
  'src/application/mrp/use-mrp.ts',
  'src/pages/planning/PlanningPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/mrp/mrp-lifecycle.types.ts')
const crud = read('src/domain/mrp/mrp-crud.service.ts')
const engine = read('src/domain/mrp/mrp-engine.service.ts')
const explosion = read('src/domain/mrp/mrp-explosion.service.ts')
const stockPolicy = read('src/domain/mrp/mrp-stock-policy.service.ts')
const snapshotSvc = read('src/domain/mrp/mrp-snapshot.service.ts')
const cmdMapper = read('src/application/mrp/mrp-command.mapper.ts')
const useHooks = read('src/application/mrp/use-mrp.ts')
const mapper = read('src/application/mrp/mrp.mapper.ts')
const calculations = read('src/domain/services/calculations.ts')
const repo = read('src/infrastructure/persistence/in-memory/aggregates/mrp-run.in-memory.repository.ts')
const poRepo = read('src/infrastructure/persistence/in-memory/aggregates/purchase-order.in-memory.repository.ts')
const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')
const mrpPage = read('src/pages/planning/PlanningPages.tsx')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const packageJson = read('package.json')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')

check(lifecycle.includes('MRP_LIFECYCLE_TRANSITIONS'), 'MRP lifecycle transitions')
check(crud.includes('persistRunMrp'), 'Domain: persistRunMrp')
check(crud.includes('persistRegenerateMrp'), 'Domain: persistRegenerate')
check(crud.includes('persistApproveMrp'), 'Domain: persistApprove')
check(crud.includes('persistReleasePurchaseSuggestions'), 'Domain: releasePurchase')
check(crud.includes('persistReleaseProductionSuggestions'), 'Domain: releaseProduction')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleMrpChange'), 'Domain: outbox')
check(crud.includes('expectedVersion'), 'Domain: optimistic lock')
check(crud.includes('createRevision'), 'Domain: snapshot immutable revision')
check(engine.includes('queryAllSalesOrders'), 'Engine: SO from repository')
check(engine.includes('queryAllStockCards'), 'Engine: stock from repository')
check(engine.includes('queryAllProductionOrders'), 'Engine: production from repository')
check(engine.includes('queryAllPurchaseOrders'), 'Engine: PO from repository')
check(engine.includes('grossRequirement'), 'Engine: gross requirement')
check(engine.includes('netShortage'), 'Engine: net requirement')
check(engine.includes('purchaseRequirement'), 'Engine: purchase requirement')
check(engine.includes('productionRequirement'), 'Engine: production requirement')
check(cmdMapper.includes('executeRunMrp'), 'App: executeRunMrp')
check(cmdMapper.includes('executeRegenerateMrp'), 'App: executeRegenerateMrp')
check(cmdMapper.includes('executeApproveMrp'), 'App: executeApproveMrp')
check(cmdMapper.includes('executeReleasePurchaseSuggestions'), 'App: executeReleasePurchase')
check(cmdMapper.includes('executeReleaseProductionSuggestions'), 'App: executeReleaseProduction')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(useHooks.includes('useRunMrpMutation'), 'Hook: run mutation')
check(useHooks.includes('useRegenerateMrpMutation'), 'Hook: regenerate mutation')
check(useHooks.includes('useApproveMrpMutation'), 'Hook: approve mutation')
check(useHooks.includes('useReleasePurchaseSuggestionsMutation'), 'Hook: release purchase')
check(useHooks.includes('useReleaseProductionSuggestionsMutation'), 'Hook: release production')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(mapper.includes('queryLatestMrpRun'), 'Mapper: repository-backed')
check(!mapper.includes('SALES_ORDERS'), 'Mapper: no hardcoded SALES_ORDERS')
check(calculations.includes('queryStockCardById'), 'generateMrp uses stock repo')
check(repo.includes('expectedVersion'), 'MrpRun repo optimistic lock')
check(poRepo.includes('expectedVersion'), 'PO repo optimistic lock')
check(bootstrap.includes('ensureMrpRunsSeeded'), 'Bootstrap: MRP seed')
const mrpSeed = read('src/infrastructure/persistence/in-memory/mrp-seed.bootstrap.ts')
check(
  bootstrap.includes('ensureMrpRunsSeeded') &&
    (mrpSeed.includes('ensurePurchasingSeeded') ||
      bootstrap.includes('ensurePurchasingSeeded') ||
      bootstrap.includes('ensurePurchaseOrdersSeeded')),
  'Bootstrap: PO seed',
)
check(uow.includes('mrpRuns'), 'UoW: mrpRuns port')
check(mrpPage.includes('Material Shortage'), 'UI: shortage panel')
check(mrpPage.includes('Purchase Suggestions'), 'UI: purchase suggestions')
check(mrpPage.includes('Production Suggestions'), 'UI: production suggestions')
check(mrpPage.includes('Inventory Coverage'), 'UI: inventory coverage')
check(mrpPage.includes('Exception Messages'), 'UI: exception messages')
check(mrpPage.includes('useRunMrpMutation'), 'UI: run mutation')
check(outbox.includes('scheduleMrpChange'), 'Outbox: MRP event')
check(packageJson.includes('validate:mrp'), 'Build: validate:mrp in pipeline')

console.log('\n--- MRP Hardening ---')
check(explosion.includes('explodeOrderVariantDemands'), 'Hardening: color/size variant explosion')
check(explosion.includes('consolidateProductDemands'), 'Hardening: multi-SO product consolidation')
check(stockPolicy.includes('readSafetyStockPolicy'), 'Hardening: safety stock min/max/ROP')
check(stockPolicy.includes('readLeadTimeBreakdown'), 'Hardening: lead time supplier/production/transit')
check(stockPolicy.includes('readFabricLots'), 'Hardening: fabric lot evaluation')
check(engine.includes('purchaseProposalGroups'), 'Hardening: purchase grouped by supplier')
check(engine.includes('productionProposalGroups'), 'Hardening: production grouped by workshop/line')
check(explosion.includes('MISSING_BOM'), 'Hardening: exception MISSING_BOM')
check(explosion.includes('MISSING_PRODUCT_CARD'), 'Hardening: exception MISSING_PRODUCT_CARD')
check(engine.includes('NO_SUPPLIER'), 'Hardening: exception NO_SUPPLIER')
check(engine.includes('NEGATIVE_STOCK'), 'Hardening: exception NEGATIVE_STOCK')
check(engine.includes('LATE_PURCHASE'), 'Hardening: exception LATE_PURCHASE')
check(engine.includes('LATE_PRODUCTION'), 'Hardening: exception LATE_PRODUCTION')
check(engine.includes('LOW_COVERAGE'), 'Hardening: exception LOW_COVERAGE')
check(snapshotSvc.includes('freezeMrpSnapshot'), 'Hardening: immutable snapshot freeze')
check(crud.includes('freezeMrpSnapshot'), 'Hardening: CRUD uses snapshot freeze')
check(mrpPage.includes('Multi Sales Order'), 'UI: product consolidation panel')
check(mrpPage.includes('Tedarikçi Grupları'), 'UI: purchase supplier groups')
check(mrpPage.includes('Atölye / Hat / Kapasite'), 'UI: production capacity groups')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
