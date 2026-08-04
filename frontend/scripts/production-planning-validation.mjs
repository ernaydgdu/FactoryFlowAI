#!/usr/bin/env node
/**
 * Phase 4 Module 2 — Production Planning validation.
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

console.log('=== Phase 4 Module 2 — Production Planning Validation ===\n')

const requiredFiles = [
  'src/domain/production-planning/planning.types.ts',
  'src/domain/production-planning/production-calendar.service.ts',
  'src/domain/production-planning/scheduling-engine.service.ts',
  'src/domain/production-planning/work-center-load.service.ts',
  'src/domain/production-planning/constraint-engine.service.ts',
  'src/domain/production-planning/planning-crud.service.ts',
  'src/application/production-planning/production-planning-scheduling.dto.ts',
  'src/application/production-planning/production-planning-scheduling.mapper.ts',
  'src/application/production-planning/production-planning-scheduling-command.mapper.ts',
  'src/application/production-planning/production-planning-scheduling.application-service.ts',
  'src/application/production-planning/use-production-planning-scheduling.ts',
  'src/modules/production-planning/pages/PlanningSchedulingPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const types = read('src/domain/production-planning/planning.types.ts')
const calendar = read('src/domain/production-planning/production-calendar.service.ts')
const engine = read('src/domain/production-planning/scheduling-engine.service.ts')
const workCenter = read('src/domain/production-planning/work-center-load.service.ts')
const constraints = read('src/domain/production-planning/constraint-engine.service.ts')
const crud = read('src/domain/production-planning/planning-crud.service.ts')
const mapper = read('src/application/production-planning/production-planning-scheduling.mapper.ts')
const cmdMapper = read('src/application/production-planning/production-planning-scheduling-command.mapper.ts')
const appService = read('src/application/production-planning/production-planning-scheduling.application-service.ts')
const hooks = read('src/application/production-planning/use-production-planning-scheduling.ts')
const ui = read('src/modules/production-planning/pages/PlanningSchedulingPages.tsx')
const layout = read('src/modules/production-planning/layout/ProductionPlanningLayout.tsx')
const router = read('src/app/router.tsx')
const navigation = read('src/config/navigation.ts')
const queryKeys = read('src/application/core/query-keys.ts')
const packageJson = read('package.json')

// Domain — Capacity Planning / Scheduling / Calendar / Constraint Engine
check(types.includes("'FINITE' | 'INFINITE'"), 'Domain: SchedulingMode finite/infinite')
check(calendar.includes('buildProductionCalendar'), 'Domain: buildProductionCalendar (production calendar)')
check(calendar.includes('workingDaysBetween'), 'Domain: workingDaysBetween (line calendar helpers)')
check(engine.includes('runSchedulingEngine'), 'Domain: runSchedulingEngine')
check(engine.includes('scheduleFinite'), 'Domain: finite scheduling (capacity clamp)')
check(engine.includes('scheduleInfinite'), 'Domain: infinite scheduling (overload accepted)')
check(engine.includes('lineDailyCapacity'), 'Domain: line daily capacity from master data')
check(workCenter.includes('buildWorkCenterLoad'), 'Domain: buildWorkCenterLoad')
check(constraints.includes('evaluateConstraints'), 'Domain: constraint engine evaluateConstraints')
check(constraints.includes('CAPACITY_OVERLOAD'), 'Constraint: capacity overload')
check(constraints.includes('TERMIN_RISK'), 'Constraint: termin risk')
check(constraints.includes('MATERIAL_SHORTAGE'), 'Constraint: material shortage (BR-03)')
check(crud.includes('persistReschedulePlan'), 'Domain: persistReschedulePlan (Planning ↔ UE)')

// Repository — reuse of existing ports, no new aggregate
check(
  engine.includes('queryAllProductionOrders'),
  'Repository: schedule reads persisted production orders (IProductionOrderRepository)',
)
check(
  engine.includes('productionLineRepository') && workCenter.includes('workshopRepository'),
  'Repository: master-data capacity ports reused (P17)',
)
check(
  crud.includes('saveLifecycleRecord') && crud.includes('queryProductionOrderByNo'),
  'Repository: reschedule writes via existing production order port — no new port',
)
check(
  !exists('src/domain/ports/persistence/aggregates/production-planning.repository.ts') &&
    !exists('src/domain/ports/persistence/aggregates/schedule.repository.ts'),
  'Architecture Freeze: no new aggregate port invented for this module',
)

// Transaction / audit / timeline / outbox conventions
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper used')
check(crud.includes('logUpdate'), 'Domain: audit log on reschedule')
check(crud.includes('addTimelineEntry'), 'Domain: timeline entry on reschedule')
check(crud.includes('scheduleWatcherNotification'), 'Domain: outbox notification on reschedule')

// Application layer
check(mapper.includes('mapScheduleBoard'), 'App: mapScheduleBoard')
check(mapper.includes('mapCapacityView'), 'App: mapCapacityView')
check(mapper.includes('mapLineLoadList'), 'App: mapLineLoadList')
check(cmdMapper.includes('executeReschedulePlan'), 'App: executeReschedulePlan command')
check(appService.includes('productionPlanningSchedulingApplicationService'), 'App: application service export')
check(hooks.includes('useScheduleBoard'), 'Hook: useScheduleBoard')
check(hooks.includes('useCapacityView'), 'Hook: useCapacityView')
check(hooks.includes('useLineLoad'), 'Hook: useLineLoad')
check(hooks.includes('useReschedulePlanMutation'), 'Hook: useReschedulePlanMutation')
check(hooks.includes('invalidateQueries'), 'Hook: query invalidate on mutation')
check(queryKeys.includes('productionPlanning:'), 'Query keys: productionPlanning namespace')

// UI layer
check(ui.includes('export function PlanningBoardPage'), 'UI: PlanningBoardPage (weekly/daily schedule)')
check(ui.includes('export function CapacityViewPage'), 'UI: CapacityViewPage')
check(ui.includes('export function LineLoadPage'), 'UI: LineLoadPage')
check(ui.includes('draggable') && ui.includes('onDrop'), 'UI: drag & drop skeleton wired to reschedule')
check(ui.includes('ModeToggle'), 'UI: finite/infinite mode toggle')
check(router.includes("'PlanningBoardPage'"), 'Router: PlanningBoardPage route wired')
check(router.includes("'CapacityViewPage'"), 'Router: CapacityViewPage route wired')
check(router.includes("'LineLoadPage'"), 'Router: LineLoadPage route wired')
check(layout.includes('/production-planning/board'), 'Layout: sub-nav Board entry')
check(navigation.includes('Planlama Board'), 'Navigation: Planlama Board menu entry')

// Build pipeline
check(packageJson.includes('validate:production-planning'), 'Build: validate:production-planning in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
