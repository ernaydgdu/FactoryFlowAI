#!/usr/bin/env node
/**
 * Phase 5 Module 2 — Quality Management validation.
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

console.log('=== Phase 5 Module 2 — Quality Management Validation ===\n')

const files = [
  'src/domain/quality/quality.types.ts',
  'src/domain/quality/inspection.service.ts',
  'src/domain/quality/qc-plan.service.ts',
  'src/domain/quality/ncr-capa.service.ts',
  'src/domain/quality/quality-query.service.ts',
  'src/application/quality/quality.dto.ts',
  'src/application/quality/quality.mapper.ts',
  'src/application/quality/quality-command.mapper.ts',
  'src/application/quality/quality.application-service.ts',
  'src/application/quality/use-quality.ts',
  'src/modules/quality-management/layout/QualityManagementLayout.tsx',
  'src/modules/quality-management/pages/QualityManagementPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const insp = read('src/domain/quality/inspection.service.ts')
const plan = read('src/domain/quality/qc-plan.service.ts')
const ncr = read('src/domain/quality/ncr-capa.service.ts')
const query = read('src/domain/quality/quality-query.service.ts')
const cmd = read('src/application/quality/quality-command.mapper.ts')
const hooks = read('src/application/quality/use-quality.ts')
const ui = read('src/modules/quality-management/pages/QualityManagementPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')

check(insp.includes('evaluateQualityGate'), 'Domain: inspection uses existing quality gate stream')
check(insp.includes('executeAcceptInspection'), 'Domain: Accept')
check(insp.includes('executeRejectInspection'), 'Domain: Reject')
check(insp.includes('executeReworkInspection'), 'Domain: Rework')
check(insp.includes('executeHoldInspection'), 'Domain: Hold')
check(plan.includes('TEXTILE_EXECUTION_ROUTE'), 'Domain: QC Plan from execution route')
check(ncr.includes('listNcrRecords'), 'Domain: NCR derived records')
check(ncr.includes('planCapaForNcr'), 'Domain: CAPA skeleton')
check(!ncr.includes('save(') && !ncr.includes('.append('), 'CAPA: plan-only skeleton, no persist')
check(query.includes('listReworkQueue'), 'Domain: Rework Queue')
check(query.includes('listHoldQueue'), 'Domain: Hold Queue')
check(query.includes('listQualityTimeline'), 'Domain: Quality Timeline')
check(ncr.includes('getNcrById'), 'Domain: NCR detail lookup')
check(cmd.includes('executeInspection'), 'App: executeInspection')
check(cmd.includes('executeAccept'), 'App: executeAccept')
check(cmd.includes('executeReject'), 'App: executeReject')
check(cmd.includes('executeRework'), 'App: executeRework')
check(cmd.includes('executeHold'), 'App: executeHold')
check(
  cmd.includes('runCommandInTransaction') || cmd.includes('runQualityWriteCommand'),
  'App: transaction wrapper',
)
check(hooks.includes('useAcceptMutation'), 'Hook: accept')
check(hooks.includes('useRejectMutation'), 'Hook: reject')
check(hooks.includes('useReworkMutation'), 'Hook: rework')
check(hooks.includes('useHoldMutation'), 'Hook: hold')
check(hooks.includes('useNcrDetail'), 'Hook: NCR detail')
check(hooks.includes('useQualityTimeline'), 'Hook: quality timeline')
check(keys.includes('quality:'), 'Query keys: quality namespace')
check(ui.includes('export function QualityDashboardPage'), 'UI: QC Dashboard')
check(ui.includes('export function QualityInspectionPage'), 'UI: Inspection Screen')
check(ui.includes('export function QualityReworkQueuePage'), 'UI: Rework Queue')
check(ui.includes('export function QualityHoldQueuePage'), 'UI: Hold Queue')
check(ui.includes('export function QualityNcrDetailPage'), 'UI: NCR Detail')
check(ui.includes('export function QualityTimelinePage'), 'UI: Quality Timeline')
check(router.includes('/quality-management'), 'Router: quality-management routes')
check(router.includes('ncr/:ncrId'), 'Router: NCR detail route')
check(nav.includes('Quality Management'), 'Navigation: Quality Management menu')
check(startup.includes("':ncrId'"), 'Startup audit: :ncrId mapped')
check(
  !exists('src/domain/ports/persistence/aggregates/ncr.repository.ts') &&
    !exists('src/domain/ports/persistence/aggregates/qc-plan.repository.ts'),
  'Architecture Freeze: no new aggregate port',
)
check(pkg.includes('validate:quality'), 'Build: validate:quality in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
