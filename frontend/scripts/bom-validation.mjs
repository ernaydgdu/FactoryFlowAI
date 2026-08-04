#!/usr/bin/env node
/**
 * Phase 2 Module 2 — BOM Management validation.
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

console.log('=== Phase 2 Module 2 — BOM Management Validation ===\n')

const requiredFiles = [
  'src/domain/bom/bom-lifecycle.types.ts',
  'src/domain/bom/bom-crud.service.ts',
  'src/domain/stock-card/stock-card-query.service.ts',
  'src/infrastructure/persistence/in-memory/aggregates/stock-card.in-memory.repository.ts',
  'src/infrastructure/persistence/in-memory/stock-card-seed.bootstrap.ts',
  'src/application/bom-designer/bom-command.mapper.ts',
  'src/application/bom-designer/bom-designer.application-service.ts',
  'src/application/bom-designer/use-bom-designer.ts',
  'src/modules/bom-designer/pages/BomDesignerPage.tsx',
  'src/modules/bom-designer/components/BomLineDialog.tsx',
  'src/modules/bom-designer/components/BomApprovalDialog.tsx',
  'src/modules/bom-designer/components/BomRevisionDialog.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/bom/bom-lifecycle.types.ts')
const crud = read('src/domain/bom/bom-crud.service.ts')
const cmdMapper = read('src/application/bom-designer/bom-command.mapper.ts')
const useHooks = read('src/application/bom-designer/use-bom-designer.ts')
const bomService = read('src/domain/services/textile/bom-service.ts')
const stockCards = read('src/domain/data/stock-cards.ts')
const stockRepo = read('src/infrastructure/persistence/in-memory/aggregates/stock-card.in-memory.repository.ts')
const bomPage = read('src/modules/bom-designer/pages/BomDesignerPage.tsx')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const packageJson = read('package.json')
const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')

check(lifecycle.includes('BOM_LIFECYCLE_TRANSITIONS'), 'BOM lifecycle transitions')
check(lifecycle.includes('isBomEditable'), 'BOM editable guard')
check(crud.includes('persistCreateBom'), 'Domain: persistCreate')
check(crud.includes('persistUpdateBom'), 'Domain: persistUpdate')
check(crud.includes('persistDeleteBomLine'), 'Domain: persistDelete')
check(crud.includes('persistApproveBom'), 'Domain: persistApprove')
check(crud.includes('persistCreateBomRevision'), 'Domain: persistRevision')
check(crud.includes('persistActivateBomRevision'), 'Domain: persistActivate')
check(crud.includes('persistArchiveBom'), 'Domain: persistArchive')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleBomChange'), 'Domain: outbox')
check(crud.includes('expectedVersion'), 'Domain: optimistic lock')
check(crud.includes('createRevision'), 'Domain: entity revision immutable')
check(cmdMapper.includes('executeCreateBom'), 'App: executeCreateBom')
check(cmdMapper.includes('executeUpdateBom'), 'App: executeUpdateBom')
check(cmdMapper.includes('executeApproveBom'), 'App: executeApproveBom')
check(cmdMapper.includes('executeCreateBomRevision'), 'App: executeCreateBomRevision')
check(cmdMapper.includes('executeArchiveBom'), 'App: executeArchiveBom')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(useHooks.includes('useUpdateBomMutation'), 'Hook: update mutation')
check(useHooks.includes('useApproveBomMutation'), 'Hook: approve mutation')
check(useHooks.includes('useCreateBomRevisionMutation'), 'Hook: revision mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(bomService.includes('queryStockCardById'), 'BOM enrich uses stock repo')
check(!bomService.includes("from '../../data/stock-cards'"), 'BOM service no hardcoded stock import')
check(stockCards.includes('queryAllStockCards'), 'stock-cards.ts reads repository')
check(stockRepo.includes('expectedVersion'), 'StockCard repo optimistic lock')
check(bootstrap.includes('ensureStockCardsSeeded'), 'Bootstrap: stock card seed before product cards')
check(bomPage.includes('BomLineDialog'), 'UI: line add/edit dialog')
check(bomPage.includes('BomApprovalDialog'), 'UI: approval dialog')
check(bomPage.includes('BomRevisionDialog'), 'UI: revision dialog')
check(bomPage.includes('BomRevisionCompare'), 'UI: revision compare')
check(bomPage.includes('alternativeMaterialCode'), 'UI: alternative material column')
check(outbox.includes('scheduleBomChange'), 'Outbox: BOM event')
check(packageJson.includes('validate:bom'), 'Build: validate:bom in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
