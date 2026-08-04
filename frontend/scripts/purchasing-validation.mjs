#!/usr/bin/env node
/**
 * Phase 3 Module 3 — Purchasing validation.
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

console.log('=== Phase 3 Module 3 — Purchasing Validation ===\n')

const requiredFiles = [
  'src/domain/purchasing/purchasing.types.ts',
  'src/domain/purchasing/purchase-order-lifecycle.types.ts',
  'src/domain/purchasing/purchase-request-crud.service.ts',
  'src/domain/purchasing/rfq-crud.service.ts',
  'src/domain/purchasing/purchase-order-crud.service.ts',
  'src/domain/purchasing/goods-receipt-crud.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/purchase-request.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/rfq.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/supplier-quotation.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/goods-receipt.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/purchasing-seed.bootstrap.ts',
  'src/application/purchasing/purchasing-command.mapper.ts',
  'src/application/purchasing/purchasing.application-service.ts',
  'src/application/purchasing/use-purchasing.ts',
  'src/pages/purchasing/PurchasingPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/purchasing/purchase-order-lifecycle.types.ts')
const prCrud = read('src/domain/purchasing/purchase-request-crud.service.ts')
const rfqCrud = read('src/domain/purchasing/rfq-crud.service.ts')
const poCrud = read('src/domain/purchasing/purchase-order-crud.service.ts')
const grCrud = read('src/domain/purchasing/goods-receipt-crud.service.ts')
const cmdMapper = read('src/application/purchasing/purchasing-command.mapper.ts')
const useHooks = read('src/application/purchasing/use-purchasing.ts')
const uow = read('src/infrastructure/persistence/in-memory/in-memory-unit-of-work.ts')
const store = read('src/infrastructure/persistence/in-memory/store-registry.ts')
const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')
const mrpCrud = read('src/domain/mrp/mrp-crud.service.ts')
const ui = read('src/pages/purchasing/PurchasingPages.tsx')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const packageJson = read('package.json')

check(lifecycle.includes('PURCHASE_ORDER_LIFECYCLE_TRANSITIONS'), 'PO lifecycle transitions')
check(lifecycle.includes('isPurchaseOrderEditable'), 'PO editable guard')
check(prCrud.includes('persistCreatePurchaseRequest'), 'Domain: persistCreatePR')
check(prCrud.includes('schedulePurchasingChange'), 'Domain PR: outbox')
check(prCrud.includes('logAudit'), 'Domain PR: audit')
check(rfqCrud.includes('persistCreateRfq'), 'Domain: persistCreateRfq')
check(poCrud.includes('persistCreatePurchaseOrder'), 'Domain: persistCreatePO')
check(poCrud.includes('persistApprovePurchaseOrder'), 'Domain: persistApprovePO')
check(poCrud.includes('persistClosePurchaseOrder'), 'Domain: persistClosePO')
check(poCrud.includes('persistCancelPurchaseOrder'), 'Domain: persistCancelPO')
check(poCrud.includes('persistArchivePurchaseOrder'), 'Domain: persistArchivePO')
check(poCrud.includes('persistCreatePurchaseOrderRevision'), 'Domain: persistRevision')
check(poCrud.includes('createRevision'), 'Domain: immutable entity revision')
check(poCrud.includes('expectedVersion'), 'Domain PO: optimistic lock')
check(grCrud.includes('persistPostGoodsReceipt'), 'Domain: persistPostGR')
check(grCrud.includes('applyGoodsReceiptToPurchaseOrder'), 'Domain: GR→PO integration')
check(cmdMapper.includes('executeCreatePurchaseRequest'), 'App: executeCreatePurchaseRequest')
check(cmdMapper.includes('executeCreateRFQ'), 'App: executeCreateRFQ')
check(cmdMapper.includes('executeCreatePurchaseOrder'), 'App: executeCreatePurchaseOrder')
check(cmdMapper.includes('executeApprovePurchaseOrder'), 'App: executeApprovePurchaseOrder')
check(cmdMapper.includes('executeClosePurchaseOrder'), 'App: executeClosePurchaseOrder')
check(cmdMapper.includes('executeCancelPurchaseOrder'), 'App: executeCancelPurchaseOrder')
check(cmdMapper.includes('executeArchivePurchaseOrder'), 'App: executeArchivePurchaseOrder')
check(
  cmdMapper.includes('runCommandInTransaction') ||
    cmdMapper.includes('runPurchasingWriteCommand'),
  'App: transaction wrapper',
)
check(useHooks.includes('useCreatePurchaseRequestMutation'), 'Hook: create PR mutation')
check(useHooks.includes('useCreateRfqMutation'), 'Hook: create RFQ mutation')
check(useHooks.includes('useCreatePurchaseOrderMutation'), 'Hook: create PO mutation')
check(useHooks.includes('useApprovePurchaseOrderMutation'), 'Hook: approve PO mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(uow.includes('purchaseRequests'), 'UoW: purchaseRequests repo')
check(uow.includes('rfqs'), 'UoW: rfqs repo')
check(uow.includes('supplierQuotations'), 'UoW: supplierQuotations repo')
check(uow.includes('goodsReceipts'), 'UoW: goodsReceipts repo')
check(store.includes('purchaseRequests:'), 'Store: purchaseRequests array')
check(store.includes('PersistedPurchaseOrderAggregate'), 'Store: PO aggregate type')
const mrpSeed = read('src/infrastructure/persistence/in-memory/mrp-seed.bootstrap.ts')
check(
  bootstrap.includes('ensureMrpRunsSeeded') && mrpSeed.includes('ensurePurchasingSeeded'),
  'Bootstrap: purchasing seed',
)
check(mrpCrud.includes('persistCreatePurchaseRequestFromMrpProposal'), 'MRP release → PR')
check(!mrpCrud.includes('status: \'Açık\''), 'MRP release: no direct PO create')
check(ui.includes('usePurchaseRequestList'), 'UI: repository-backed PR list')
check(ui.includes('usePurchaseOrderList'), 'UI: repository-backed PO list')
check(ui.includes('useApprovePurchaseOrderMutation'), 'UI: PO approval')
check(ui.includes('useCreatePurchaseOrderRevisionMutation'), 'UI: PO revision')
check(!ui.includes('PURCHASE_REQUISITIONS'), 'UI: no mock PURCHASE_REQUISITIONS')
check(!ui.includes('PURCHASE_ORDERS'), 'UI: no mock PURCHASE_ORDERS')
check(outbox.includes('schedulePurchasingChange'), 'Outbox: Purchasing event')
check(packageJson.includes('validate:purchasing'), 'Build: validate:purchasing in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
