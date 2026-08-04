#!/usr/bin/env node
/**
 * Manufacturing Memory Engine validation — append-only, no LLM, Freeze-safe.
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

console.log('=== Manufacturing Memory Engine Validation ===\n')

const files = [
  'src/domain/brain/manufacturing-memory/types.ts',
  'src/domain/brain/manufacturing-memory/store.ts',
  'src/domain/brain/manufacturing-memory/collector.ts',
  'src/domain/brain/manufacturing-memory/query.service.ts',
  'src/domain/brain/manufacturing-memory/memory.service.ts',
  'src/domain/brain/manufacturing-memory/index.ts',
  'src/application/brain-memory/brain-memory.application-service.ts',
  'src/application/brain-memory/use-brain-memory.ts',
  'src/modules/brain-memory/layout/BrainMemoryLayout.tsx',
  'src/modules/brain-memory/pages/BrainMemoryPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const types = read('src/domain/brain/manufacturing-memory/types.ts')
const store = read('src/domain/brain/manufacturing-memory/store.ts')
const collector = read('src/domain/brain/manufacturing-memory/collector.ts')
const query = read('src/domain/brain/manufacturing-memory/query.service.ts')
const svc = read('src/domain/brain/manufacturing-memory/memory.service.ts')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const arch = exists('../docs/architecture/MANUFACTURING-MEMORY-ENGINE-ARCHITECTURE.md')
  ? read('../docs/architecture/MANUFACTURING-MEMORY-ENGINE-ARCHITECTURE.md')
  : ''
const coverage = exists('../docs/architecture/MANUFACTURING-MEMORY-COVERAGE-REPORT.md')
  ? read('../docs/architecture/MANUFACTURING-MEMORY-COVERAGE-REPORT.md')
  : ''

check(types.includes('MemoryRecord'), 'Schema: MemoryRecord')
check(types.includes('timestamp'), 'Schema: timestamp')
check(types.includes('confidence'), 'Schema: confidence')
for (const index of [
  'DecisionIndex',
  'SupplierIndex',
  'MaterialIndex',
  'MachineIndex',
  'OperatorIndex',
  'CustomerIndex',
  'StyleIndex',
  'ProductionIndex',
  'InventoryIndex',
  'ShipmentIndex',
  'QualityIndex',
  'PlanningIndex',
  'SimulationIndex',
  'RiskIndex',
  'ConstraintIndex',
  'KpiIndex',
]) {
  check(types.includes(index), `Index: ${index}`)
}
for (const field of [
  'observation',
  'contextSnapshot',
  'decision',
  'action',
  'outcome',
  'accuracy',
  'lessons',
  'traceId',
  'links',
  'correctionOf',
]) {
  check(types.includes(field), `Experience field: ${field}`)
}
check(types.includes('llmEnabled: false'), 'Schema: llm disabled')
check(types.includes('erpMutations: false'), 'Schema: no ERP mutations')

check(store.includes('brainDecisionMemoryRepo'), 'Store: existing port')
check(store.includes('appendMemoryRecord'), 'Store: append')
check(store.includes('findById'), 'Store: idempotent check')
check(!store.includes('deleteEntry') && !store.includes('.delete('), 'Store: no delete API')
check(store.includes('appendMemoryCorrection'), 'Store: append-only corrections')
check(collector.includes('queryAllSalesOrders'), 'Collector: sales')
check(collector.includes('runManufacturingPlanning'), 'Collector: planning')
check(collector.includes('runManufacturingSimulation'), 'Collector: simulation')
check(collector.includes('queryCostClosingBrainReadModel'), 'Collector: cost closing')
check(collector.includes('queryStyleClosingBrainReadModel'), 'Collector: style closing')
check(!collector.includes('.command'), 'Collector: no command paths')
check(query.includes('runMemoryQueryPreset'), 'Query: presets')
check(query.includes('recurring-bottlenecks'), 'Query: bottlenecks')
check(query.includes('historical-otif'), 'Query: OTIF')
check(query.includes('replayProductionOrderTimeline'), 'Query: production timeline replay')
check(svc.includes('ensureManufacturingMemoryCollected'), 'Orchestrator')
check(!svc.toLowerCase().includes('openai'), 'No OpenAI')
check(!/\bpredict[a-z]*\(/i.test(query) && !query.includes('forecast'), 'No prediction APIs')

check(router.includes('/brain-memory'), 'Router: /brain-memory')
check(router.includes('BrainMemoryCoveragePage'), 'Router: coverage')
check(nav.includes('/brain-memory/coverage'), 'Nav: memory')
check(iam.includes("prefix: '/brain-memory'"), 'IAM')
check(keys.includes('brainMemory'), 'Query keys')
check(pkg.includes('validate:manufacturing-memory'), 'package.json validate')
check(
  /validate:manufacturing-memory/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build runs validate:manufacturing-memory',
)
check(arch.includes('Memory'), 'Docs: architecture')
check(arch.includes('no LLM') || arch.includes('No LLM'), 'Docs: no LLM')
check(coverage.includes('Coverage'), 'Docs: coverage')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
