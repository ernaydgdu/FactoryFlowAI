#!/usr/bin/env node
/**
 * Phase 5 Module 1 — Shop Floor Execution (MES) validation.
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

console.log('=== Phase 5 Module 1 — Shop Floor Validation ===\n')

const required = [
  'src/domain/shop-floor/shop-floor.types.ts',
  'src/domain/shop-floor/production-declaration.service.ts',
  'src/domain/shop-floor/completion-confirmation.service.ts',
  'src/domain/shop-floor/machine-tracking.service.ts',
  'src/domain/shop-floor/labor-tracking.service.ts',
  'src/application/shop-floor/shop-floor.dto.ts',
  'src/application/shop-floor/shop-floor.mapper.ts',
  'src/application/shop-floor/shop-floor-command.mapper.ts',
  'src/application/shop-floor/shop-floor.application-service.ts',
  'src/application/shop-floor/use-shop-floor.ts',
  'src/modules/shop-floor/layout/ShopFloorLayout.tsx',
  'src/modules/shop-floor/pages/ShopFloorPages.tsx',
]

for (const f of required) check(exists(f), `File exists: ${f}`)

const decl = read('src/domain/shop-floor/production-declaration.service.ts')
const complete = read('src/domain/shop-floor/completion-confirmation.service.ts')
const machine = read('src/domain/shop-floor/machine-tracking.service.ts')
const labor = read('src/domain/shop-floor/labor-tracking.service.ts')
const cmd = read('src/application/shop-floor/shop-floor-command.mapper.ts')
const hooks = read('src/application/shop-floor/use-shop-floor.ts')
const ui = read('src/modules/shop-floor/pages/ShopFloorPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const queryKeys = read('src/application/core/query-keys.ts')

check(decl.includes('postOperationDailyEntry'), 'Domain: declaration posts operation daily entry')
check(decl.includes('addDailyProductionEntry'), 'Domain: declaration bridges to UE producedQty')
check(complete.includes('persistFinishedGoodsReceipt'), 'Domain: completion posts FG to persisted ledger')
check(complete.includes("transitionProductionOrderStatus"), 'Domain: completion confirms via lifecycle Completed')
check(machine.includes('getMachineStatusList'), 'Domain: machine tracking read-model')
check(labor.includes('getLaborTrackingList'), 'Domain: labor tracking read-model')
check(cmd.includes('executeStartOperation'), 'App: executeStartOperation')
check(cmd.includes('executePauseOperation'), 'App: executePauseOperation')
check(cmd.includes('executeResumeOperation'), 'App: executeResumeOperation')
check(cmd.includes('executeCompleteOperation'), 'App: executeCompleteOperation')
check(cmd.includes('executeDeclareProduction'), 'App: executeDeclareProduction')
check(cmd.includes('executeMoveBundle'), 'App: executeMoveBundle')
check(cmd.includes('executeFinishWorkSession'), 'App: executeFinishWorkSession')
check(cmd.includes('runCommandInTransaction'), 'App: transaction wrapper')
check(hooks.includes('useDeclareProductionMutation'), 'Hook: declare production')
check(hooks.includes('useStartOperationMutation'), 'Hook: start operation')
check(hooks.includes('useMoveBundleMutation'), 'Hook: move bundle')
check(hooks.includes('useFinishWorkSessionMutation'), 'Hook: finish work session')
check(hooks.includes('invalidateQueries'), 'Hook: query invalidate')
check(queryKeys.includes('shopFloor:'), 'Query keys: shopFloor namespace')
check(ui.includes('export function ShopFloorOperatorPage'), 'UI: Operator Dashboard')
check(ui.includes('export function ShopFloorWorkstationPage'), 'UI: Workstation')
check(ui.includes('export function ShopFloorBundlePage'), 'UI: Bundle')
check(ui.includes('export function ShopFloorDeclarationPage'), 'UI: Production Declaration')
check(ui.includes('export function ShopFloorMachineStatusPage'), 'UI: Machine Status')
check(ui.includes('export function ShopFloorLaborPage'), 'UI: Labor Tracking')
check(ui.includes('export function ShopFloorTimelinePage'), 'UI: Timeline')
check(ui.includes('export function ShopFloorOperationPage'), 'UI: Operation Screen')
check(ui.includes('/execution-platform/quality'), 'UI: Quality gate entry point')
check(router.includes('/shop-floor'), 'Router: shop-floor routes')
check(nav.includes('Shop Floor (MES)'), 'Navigation: Shop Floor menu')
check(
  !exists('src/domain/ports/persistence/aggregates/shop-floor.repository.ts'),
  'Architecture Freeze: no new aggregate port',
)
check(pkg.includes('validate:shop-floor'), 'Build: validate:shop-floor in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
