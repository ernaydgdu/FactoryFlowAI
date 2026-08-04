#!/usr/bin/env node
/**
 * Phase 2 Module 1 — Product Card CRUD & Lifecycle validation.
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

console.log('=== Phase 2 Module 1 — Product Card CRUD & Lifecycle Validation ===\n')

const requiredFiles = [
  'src/domain/product-card/lifecycle-types.ts',
  'src/domain/product-card/product-card-crud.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/product-card.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/product-card-seed.bootstrap.ts',
  'src/application/product-card/product-card-command.mapper.ts',
  'src/application/product-card/product-card.application-service.ts',
  'src/application/product-card/use-product-card.ts',
  'src/modules/product-card/pages/ProductCreatePage.tsx',
  'src/modules/product-card/pages/ProductEditPage.tsx',
  'src/modules/product-card/components/ProductLifecyclePanel.tsx',
  'src/modules/product-card/components/ProductApprovalDialog.tsx',
  'src/modules/product-card/components/ProductRevisionDialog.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/product-card/lifecycle-types.ts')
const crud = read('src/domain/product-card/product-card-crud.service.ts')
const cmdMapper = read('src/application/product-card/product-card-command.mapper.ts')
const appService = read('src/application/product-card/product-card.application-service.ts')
const useHooks = read('src/application/product-card/use-product-card.ts')
const approvalDialog = read('src/modules/product-card/components/ProductApprovalDialog.tsx')
const revisionDialog = read('src/modules/product-card/components/ProductRevisionDialog.tsx')
const editPage = read('src/modules/product-card/pages/ProductEditPage.tsx')
const repo = read('src/infrastructure/persistence/in-memory/aggregates/product-card.in-memory.repository.ts')
const productsData = read('src/domain/data/products.ts')
const seedBootstrap = read('src/infrastructure/persistence/in-memory/product-card-seed.bootstrap.ts')
const router = read('src/app/router.tsx')
const orderProductTab = read('src/modules/orders/components/create/ProductTab.tsx')
const packageJson = read('package.json')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')

const lifecycleStates = ['Draft', 'Under Review', 'Approved', 'In Production', 'Closed', 'Archived']
for (const state of lifecycleStates) {
  check(lifecycle.includes(`'${state}'`), `Lifecycle state: ${state}`)
}

check(lifecycle.includes('PRODUCT_CARD_LIFECYCLE_TRANSITIONS'), 'Lifecycle transitions defined')
check(lifecycle.includes('isProductCardTransitionAllowed'), 'Transition guard')
check(crud.includes('persistCreateProductCard'), 'Domain: persistCreate')
check(crud.includes('persistUpdateProductCard'), 'Domain: persistUpdate')
check(crud.includes('persistCreateProductCardRevision'), 'Domain: persistRevision')
check(crud.includes('persistApproveProductCard'), 'Domain: persistApprove')
check(crud.includes('persistDeactivateProductCard'), 'Domain: persistDeactivate')
check(crud.includes('persistArchiveProductCard'), 'Domain: persistArchive')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleProductCardChange'), 'Domain: outbox schedule')
check(crud.includes('expectedVersion'), 'Domain: optimistic lock')
check(cmdMapper.includes('executeCreateProductCard'), 'App: executeCreate')
check(cmdMapper.includes('executeUpdateProductCard'), 'App: executeUpdate')
check(cmdMapper.includes('executeCreateRevision'), 'App: executeCreateRevision')
check(cmdMapper.includes('executeApproveProductCard'), 'App: executeApprove')
check(cmdMapper.includes('executeDeactivateProductCard'), 'App: executeDeactivate')
check(cmdMapper.includes('executeArchiveProductCard'), 'App: executeArchive')
check(
  cmdMapper.includes('runCommandInTransaction') ||
    cmdMapper.includes('runProductCardWriteCommand'),
  'App: transaction wrapper',
)
check(useHooks.includes('useCreateProductCardMutation'), 'Hook: create mutation')
check(useHooks.includes('useUpdateProductCardMutation'), 'Hook: update mutation')
check(useHooks.includes('useApproveProductCardMutation'), 'Hook: approve mutation')
check(repo.includes('expectedVersion'), 'Repo: optimistic lock save')
check(productsData.includes('queryAllProductCards'), 'products.ts reads repository')
check(!productsData.includes('lazyArray'), 'products.ts not lazy runtime source')
check(seedBootstrap.includes('buildAllTextileProductCards'), 'Seed from generator only')
check(useHooks.includes('useCreateProductCardRevisionMutation'), 'Hook: revision mutation')
check(useHooks.includes('useArchiveProductCardMutation'), 'Hook: archive mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: list invalidate on mutation')
check(appService.includes('editForm'), 'App: editForm query')
check(approvalDialog.includes('useApproveProductCardMutation'), 'UI: approval dialog')
check(revisionDialog.includes('useCreateProductCardRevisionMutation'), 'UI: revision dialog')
check(editPage.includes('useUpdateProductCardMutation'), 'UI: edit page update')
check(router.includes('/products/:id/edit'), 'Route: /products/:id/edit')
check(router.includes('/products/new'), 'Route: /products/new')
check(orderProductTab.includes('useApprovedProductCardOptions'), 'Order: approved card select only')
check(!orderProductTab.includes('updateProduct'), 'Order: no product card create fields')
check(outbox.includes('scheduleProductCardChange'), 'Outbox: product card event')
check(packageJson.includes('validate:product-card'), 'Build: validate:product-card in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
