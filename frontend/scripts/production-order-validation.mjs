#!/usr/bin/env node
/**
 * Phase 4 Module 3 — Production Order validation.
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

console.log('=== Phase 4 Module 3 — Production Order Validation ===\n')

const requiredFiles = [
  'src/domain/production-order/lifecycle-types.ts',
  'src/domain/production-order/lifecycle-service.ts',
  'src/domain/production-order/material-reservation.service.ts',
  'src/domain/production-order/split-merge.service.ts',
  'src/domain/production-order/operation-sequence.service.ts',
  'src/application/production-order-lifecycle/production-order-board.dto.ts',
  'src/application/production-order-lifecycle/production-order-board.mapper.ts',
  'src/application/production-order-lifecycle/production-order-board-command.mapper.ts',
  'src/application/production-order-lifecycle/use-production-order-board.ts',
  'src/modules/production-order-lifecycle/pages/ProductionOrderBoardPages.tsx',
]

for (const file of requiredFiles) {
  check(exists(file), `File exists: ${file}`)
}

const lifecycleTypes = read('src/domain/production-order/lifecycle-types.ts')
const lifecycleService = read('src/domain/production-order/lifecycle-service.ts')
const reservationSvc = read('src/domain/production-order/material-reservation.service.ts')
const splitMerge = read('src/domain/production-order/split-merge.service.ts')
const opSequence = read('src/domain/production-order/operation-sequence.service.ts')
const boardMapper = read('src/application/production-order-lifecycle/production-order-board.mapper.ts')
const cmdMapper = read('src/application/production-order-lifecycle/production-order-board-command.mapper.ts')
const lifecycleMapper = read('src/application/production-order-lifecycle/production-order-lifecycle.mapper.ts')
const hooks = read('src/application/production-order-lifecycle/use-production-order-board.ts')
const ui = read('src/modules/production-order-lifecycle/pages/ProductionOrderBoardPages.tsx')
const layout = read('src/modules/production-order-lifecycle/layout/ProductionOrderLifecycleLayout.tsx')
const router = read('src/app/router.tsx')
const navigation = read('src/config/navigation.ts')
const packageJson = read('package.json')

// Domain — aggregate & lifecycle (mevcut mimari korunuyor)
check(lifecycleTypes.includes('ProductionOrderLifecycleRecord'), 'Domain: Production Order aggregate record')
check(lifecycleTypes.includes('LIFECYCLE_TRANSITIONS'), 'Domain: lifecycle transition rules')
check(
  ['Released', 'In Production', 'Paused', 'Completed', 'Cancelled'].every((s) => lifecycleTypes.includes(`'${s}'`)),
  'Domain: Release/Start/Pause/Resume/Complete/Cancel statuses',
)
check(lifecycleService.includes('transitionProductionOrderStatus'), 'Domain: status transition command')

// Domain — Material reservation bağlantısı (kalıcı Stock Ledger)
check(reservationSvc.includes('persistMaterialReservationForOrder'), 'Domain: persistMaterialReservationForOrder')
check(reservationSvc.includes('releaseMaterialReservationForOrder'), 'Domain: releaseMaterialReservationForOrder')
check(reservationSvc.includes('getMaterialReservationState'), 'Domain: getMaterialReservationState (read model)')
check(
  reservationSvc.includes('persistReservation') && reservationSvc.includes("from '@/domain/inventory/stock-ledger-crud.service'"),
  'Reservation: posts to PERSISTED stock ledger (P14/P15), not throwaway ledger',
)
check(reservationSvc.includes("referenceType: 'PRODUCTION'"), 'Reservation: PRODUCTION reference type')
check(
  lifecycleMapper.includes('persistMaterialReservationForOrder'),
  'Integration: Released transition wired to persisted reservation',
)

// Domain — Split / Merge iskeleti
check(splitMerge.includes('planSplitProductionOrder'), 'Domain: planSplitProductionOrder (skeleton)')
check(splitMerge.includes('planMergeProductionOrders'), 'Domain: planMergeProductionOrders (skeleton)')
check(
  !splitMerge.includes('crud.service') && !splitMerge.includes('.save(') && !splitMerge.includes('saveLifecycleRecord'),
  'Split/Merge: plan-only skeleton, no persistence mutation',
)

// Domain — Operation sequence
check(opSequence.includes('deriveOperationSequence'), 'Domain: deriveOperationSequence')
check(opSequence.includes('validateOperationSequence'), 'Domain: validateOperationSequence')

// Repository — mevcut portların yeniden kullanımı, yeni port yok
check(
  reservationSvc.includes('queryProductionOrderByNo'),
  'Repository: reuses IProductionOrderRepository reads',
)
check(
  reservationSvc.includes('queryBalance') && reservationSvc.includes('queryReservationMovements'),
  'Repository: reuses Stock Ledger query service — no new port',
)
check(
  !exists('src/domain/ports/persistence/aggregates/material-reservation.repository.ts') &&
    !exists('src/domain/ports/persistence/aggregates/production-order-split.repository.ts'),
  'Architecture Freeze: no new aggregate port invented for this module',
)

// Application layer
check(boardMapper.includes('mapStatusBoard'), 'App: mapStatusBoard')
check(boardMapper.includes('mapOperationList'), 'App: mapOperationList')
check(boardMapper.includes('mapMaterialReservation'), 'App: mapMaterialReservation')
check(boardMapper.includes('mapSplitPlan') && boardMapper.includes('mapMergePlan'), 'App: split/merge plan mappers')
check(cmdMapper.includes('executeReserveMaterials'), 'App: executeReserveMaterials command')
check(cmdMapper.includes('runCommandInTransaction'), 'App: transaction wrapper used')
check(hooks.includes('useProductionOrderStatusBoard'), 'Hook: useProductionOrderStatusBoard')
check(hooks.includes('useProductionOrderOperationList'), 'Hook: useProductionOrderOperationList')
check(hooks.includes('useMaterialReservationView'), 'Hook: useMaterialReservationView')
check(hooks.includes('useReserveMaterialsMutation'), 'Hook: useReserveMaterialsMutation')
check(hooks.includes('invalidateQueries'), 'Hook: query invalidate on mutation')

// UI layer
check(ui.includes('export function ProductionOrderStatusBoardPage'), 'UI: Status Board page')
check(ui.includes('export function ProductionOrderOperationListPage'), 'UI: Operation List page')
check(ui.includes('export function ProductionOrderReservationPage'), 'UI: Material Reservation page')
check(ui.includes('Split Önizleme'), 'UI: split preview skeleton on board')
check(router.includes("'ProductionOrderStatusBoardPage'"), 'Router: Status Board route wired')
check(router.includes("'ProductionOrderOperationListPage'"), 'Router: Operation List route wired')
check(router.includes("'ProductionOrderReservationPage'"), 'Router: Reservation route wired')
check(layout.includes('/production-order-lifecycle/board'), 'Layout: sub-nav Durum Panosu entry')
check(navigation.includes('Malzeme Rezervasyonu'), 'Navigation: Malzeme Rezervasyonu menu entry')

// Build pipeline
check(packageJson.includes('validate:production-order"'), 'Build: validate:production-order in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
