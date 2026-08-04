#!/usr/bin/env node
/**
 * Phase 2 Module 3 — Cost Sheet Management validation.
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

console.log('=== Phase 2 Module 3 — Cost Sheet Management Validation ===\n')

const requiredFiles = [
  'src/domain/cost-sheet/cost-sheet-lifecycle.types.ts',
  'src/domain/cost-sheet/cost-sheet-crud.service.ts',
  'src/domain/services/textile/cost-sheet-service.ts',
  'src/application/cost-sheet-designer/cost-sheet-command.mapper.ts',
  'src/application/cost-sheet-designer/cost-sheet-designer.application-service.ts',
  'src/application/cost-sheet-designer/use-cost-sheet-designer.ts',
  'src/modules/cost-sheet-designer/pages/CostSheetDesignerPage.tsx',
  'src/modules/cost-sheet-designer/components/CostSheetApprovalDialog.tsx',
  'src/modules/cost-sheet-designer/components/CostSheetRevisionDialog.tsx',
  'src/modules/cost-sheet-designer/components/CostSheetVariancePreview.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycle = read('src/domain/cost-sheet/cost-sheet-lifecycle.types.ts')
const crud = read('src/domain/cost-sheet/cost-sheet-crud.service.ts')
const costService = read('src/domain/services/textile/cost-sheet-service.ts')
const cmdMapper = read('src/application/cost-sheet-designer/cost-sheet-command.mapper.ts')
const useHooks = read('src/application/cost-sheet-designer/use-cost-sheet-designer.ts')
const bomCrud = read('src/domain/bom/bom-crud.service.ts')
const textileErp = read('src/domain/types/textile-erp.ts')
const costPage = read('src/modules/cost-sheet-designer/pages/CostSheetDesignerPage.tsx')
const outbox = read('src/domain/platform/services/outbox-scheduler.ts')
const router = read('src/app/router.tsx')
const packageJson = read('package.json')
const productCardService = read('src/domain/services/textile/product-card-service.ts')

check(lifecycle.includes('COST_SHEET_LIFECYCLE_TRANSITIONS'), 'Cost sheet lifecycle transitions')
check(lifecycle.includes('isCostSheetEditable'), 'Cost sheet editable guard')
check(textileErp.includes('PlannedCostSheet'), 'Type: PlannedCostSheet on aggregate')
check(textileErp.includes('costSheet: PlannedCostSheet'), 'Product card embeds costSheet')
check(crud.includes('persistCreateCostSheet'), 'Domain: persistCreate')
check(crud.includes('persistUpdateCostSheet'), 'Domain: persistUpdate')
check(crud.includes('persistApproveCostSheet'), 'Domain: persistApprove')
check(crud.includes('persistCreateCostSheetRevision'), 'Domain: persistRevision')
check(crud.includes('persistActivateCostSheetRevision'), 'Domain: persistActivate')
check(crud.includes('persistArchiveCostSheet'), 'Domain: persistArchive')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('appendEnterpriseTimelineEntry'), 'Domain: timeline')
check(crud.includes('scheduleCostSheetChange'), 'Domain: outbox')
check(crud.includes('expectedVersion'), 'Domain: optimistic lock')
check(crud.includes('createRevision'), 'Domain: entity revision immutable')
check(crud.includes('syncCostSheetAfterBomChange'), 'Domain: BOM sync helper')
check(costService.includes('queryStockCardById'), 'Cost calc uses stock repo')
check(costService.includes('calculateBomDerivedAmounts'), 'Cost calc from BOM')
check(costService.includes('getStockUnitPrice'), 'Unit price from stock attributes')
check(!costService.includes("from '../../data/stock-cards'"), 'No hardcoded stock import in cost service')
check(bomCrud.includes('syncCostSheetAfterBomChange'), 'BOM write triggers cost recalc')
check(cmdMapper.includes('executeCreateCostSheet'), 'App: executeCreateCostSheet')
check(cmdMapper.includes('executeUpdateCostSheet'), 'App: executeUpdateCostSheet')
check(cmdMapper.includes('executeApproveCostSheet'), 'App: executeApproveCostSheet')
check(cmdMapper.includes('executeCreateRevision'), 'App: executeCreateRevision')
check(cmdMapper.includes('executeArchiveCostSheet'), 'App: executeArchiveCostSheet')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(useHooks.includes('useUpdateCostSheetMutation'), 'Hook: update mutation')
check(useHooks.includes('useApproveCostSheetMutation'), 'Hook: approve mutation')
check(useHooks.includes('useCreateCostSheetRevisionMutation'), 'Hook: revision mutation')
check(useHooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(productCardService.includes('buildPlannedCostSheet'), 'Seed: cost sheet on product card')
check(costPage.includes('CostSheetApprovalDialog'), 'UI: approval dialog')
check(costPage.includes('CostSheetRevisionDialog'), 'UI: revision dialog')
check(costPage.includes('CostSheetVariancePreview'), 'UI: variance preview')
check(costPage.includes('Maliyet Kırılımı'), 'UI: cost breakdown tab')
check(router.includes('/products/:productId/cost-sheet'), 'Route: cost-sheet')
check(outbox.includes('scheduleCostSheetChange'), 'Outbox: CostSheet event')
check(packageJson.includes('validate:cost-sheet'), 'Build: validate:cost-sheet in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
