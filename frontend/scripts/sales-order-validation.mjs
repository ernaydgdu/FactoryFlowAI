#!/usr/bin/env node
/**
 * Phase 3 Module 1 — Sales Order Management validation.
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

console.log('=== Phase 3 Module 1 — Sales Order Management Validation ===\n')

const requiredFiles = [
  'src/domain/sales-order/sales-order-lifecycle.types.ts',
  'src/domain/sales-order/sales-order-crud.service.ts',
  'src/domain/sales-order/sales-order-query.service.ts',
  'src/domain/services/sales-order/sales-order-build.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/sales-order.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/sales-order-seed.bootstrap.ts',
  'src/application/sales-order/sales-order-command.mapper.ts',
  'src/application/sales-order/sales-order.application-service.ts',
  'src/application/sales-order/use-sales-order.ts',
  'src/modules/orders/components/OrderLifecyclePanel.tsx',
  'src/modules/orders/pages/OrderCreatePage.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/sales-order/sales-order-lifecycle.types.ts')
const crud = read('src/domain/sales-order/sales-order-crud.service.ts')
const build = read('src/domain/services/sales-order/sales-order-build.service.ts')
const cmdMapper = read('src/application/sales-order/sales-order-command.mapper.ts')
const useHooks = read('src/application/sales-order/use-sales-order.ts')
const ordersData = read('src/domain/data/orders.ts')
const repo = read('src/infrastructure/persistence/in-memory/aggregates/sales-order.in-memory.repository.ts')
const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')
const createHook = read('src/modules/orders/hooks/use-order-create.ts')
const createPage = read('src/modules/orders/pages/OrderCreatePage.tsx')
const editPage = read('src/pages/orders/OrderEditPage.tsx')
const productTab = read('src/modules/orders/components/create/ProductTab.tsx')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const packageJson = read('package.json')

check(lifecycle.includes('SALES_ORDER_LIFECYCLE_TRANSITIONS'), 'SO lifecycle transitions')
check(lifecycle.includes('isSalesOrderEditable'), 'SO editable guard')
check(crud.includes('persistCreateSalesOrder'), 'Domain: persistCreate')
check(crud.includes('persistUpdateSalesOrder'), 'Domain: persistUpdate')
check(crud.includes('persistApproveSalesOrder'), 'Domain: persistApprove')
check(crud.includes('persistCancelSalesOrder'), 'Domain: persistCancel')
check(crud.includes('persistCloseSalesOrder'), 'Domain: persistClose')
check(crud.includes('persistArchiveSalesOrder'), 'Domain: persistArchive')
check(crud.includes('persistCreateSalesOrderRevision'), 'Domain: persistRevision')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleSalesOrderChange'), 'Domain: outbox')
check(crud.includes('expectedVersion'), 'Domain: optimistic lock')
check(crud.includes('createRevision'), 'Domain: entity revision immutable')
check(build.includes('assertApprovedProductCard'), 'Build: approved PC only')
check(build.includes('generateMrp'), 'Build: MRP from BOM')
check(build.includes('queryProductCardById'), 'Build: PC from repository')
check(repo.includes('expectedVersion'), 'Repo: optimistic lock')
check(repo.includes('findByOrderNo'), 'Repo: findByOrderNo')
check(bootstrap.includes('ensureSalesOrdersSeeded'), 'Bootstrap: sales order seed')
check(ordersData.includes('queryAllSalesOrders'), 'orders.ts reads repository')
check(ordersData.includes('generateSeedSalesOrders'), 'orders.ts seed export')
check(!ordersData.includes('lazyArray(buildSalesOrders)'), 'orders.ts no lazy runtime generator')
check(cmdMapper.includes('executeCreateSalesOrder'), 'App: executeCreateSalesOrder')
check(cmdMapper.includes('executeUpdateSalesOrder'), 'App: executeUpdateSalesOrder')
check(cmdMapper.includes('executeApproveSalesOrder'), 'App: executeApproveSalesOrder')
check(cmdMapper.includes('executeCancelSalesOrder'), 'App: executeCancelSalesOrder')
check(cmdMapper.includes('executeCloseSalesOrder'), 'App: executeCloseSalesOrder')
check(cmdMapper.includes('executeArchiveSalesOrder'), 'App: executeArchiveSalesOrder')
check(cmdMapper.includes('executeCreateRevision'), 'App: executeCreateRevision')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(useHooks.includes('useCreateSalesOrderMutation'), 'Hook: create mutation')
check(useHooks.includes('useUpdateSalesOrderMutation'), 'Hook: update mutation')
check(useHooks.includes('useApproveSalesOrderMutation'), 'Hook: approve mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(!createHook.includes('mock)'), 'Create hook: no mock save')
check(createHook.includes('toCreateCommand'), 'Create hook: command builder')
check(createHook.includes('queryProductCardById'), 'Create hook: PC hydrate')
check(createPage.includes('useCreateSalesOrderMutation'), 'UI: create mutation')
check(!createPage.includes('window.alert'), 'UI: no alert mock save')
check(editPage.includes('useUpdateSalesOrderMutation'), 'UI: edit mutation')
check(!editPage.includes('mock kayıt'), 'UI: edit no mock')
check(productTab.includes('useApprovedProductCardOptions'), 'ProductTab: approved PC only')
check(outbox.includes('scheduleSalesOrderChange'), 'Outbox: SalesOrder event')
check(packageJson.includes('validate:sales-order'), 'Build: validate:sales-order in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
