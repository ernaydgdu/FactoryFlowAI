#!/usr/bin/env node
/**
 * Manufacturing Simulation Engine validation — no LLM, Freeze-safe, read-only.
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

console.log('=== Manufacturing Simulation Engine Validation ===\n')

const files = [
  'src/domain/brain/manufacturing-simulation/types.ts',
  'src/domain/brain/manufacturing-simulation/scenario-catalog.ts',
  'src/domain/brain/manufacturing-simulation/simulator.ts',
  'src/domain/brain/manufacturing-simulation/simulation.service.ts',
  'src/domain/brain/manufacturing-simulation/index.ts',
  'src/application/brain-simulation/brain-simulation.application-service.ts',
  'src/application/brain-simulation/use-brain-simulation.ts',
  'src/modules/brain-simulation/layout/BrainSimulationLayout.tsx',
  'src/modules/brain-simulation/pages/BrainSimulationPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const types = read('src/domain/brain/manufacturing-simulation/types.ts')
const catalog = read('src/domain/brain/manufacturing-simulation/scenario-catalog.ts')
const sim = read('src/domain/brain/manufacturing-simulation/simulator.ts')
const svc = read('src/domain/brain/manufacturing-simulation/simulation.service.ts')
const pages = read('src/modules/brain-simulation/pages/BrainSimulationPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const arch = exists('../docs/architecture/MANUFACTURING-SIMULATION-ENGINE-ARCHITECTURE.md')
  ? read('../docs/architecture/MANUFACTURING-SIMULATION-ENGINE-ARCHITECTURE.md')
  : ''
const coverage = exists('../docs/architecture/MANUFACTURING-SIMULATION-COVERAGE-REPORT.md')
  ? read('../docs/architecture/MANUFACTURING-SIMULATION-COVERAGE-REPORT.md')
  : ''

check(types.includes('ScenarioSlot'), 'Schema: ScenarioSlot')
check(types.includes("'CURRENT'"), 'Schema: CURRENT')
check(types.includes("'A'"), 'Schema: A')
check(types.includes("'B'"), 'Schema: B')
check(types.includes("'C'"), 'Schema: C')
check(types.includes('MACHINE_DOWNTIME'), 'Shock: machine downtime')
check(types.includes('SUPPLIER_DELAY'), 'Shock: supplier delay')
check(types.includes('ORDER_URGENT'), 'Shock: order urgent')
check(types.includes('OVERTIME_ENABLED'), 'Shock: overtime')
check(types.includes('OPERATOR_AVAILABILITY'), 'Shock: operator')
check(types.includes('CUTTING_YIELD_DROP'), 'Shock: yield drop')
check(types.includes('otifImpactPct'), 'Metric: OTIF')
check(types.includes('productionCompletionDayOffset'), 'Metric: completion')
check(types.includes('resourceUtilizationPct'), 'Metric: utilization')
check(types.includes('queueGrowthUnits'), 'Metric: queue')
check(types.includes('bottleneckMoved'), 'Metric: bottleneck')
check(types.includes('wipDelta'), 'Metric: WIP')
check(types.includes('inventoryImpactUnits'), 'Metric: inventory')
check(types.includes('purchasingImpactQty'), 'Metric: purchasing')
check(types.includes('shipmentDelayDays'), 'Metric: shipment')
check(types.includes('costDelta'), 'Metric: cost')
check(types.includes('confidence'), 'Metric: confidence')
check(types.includes('TimelinePoint'), 'Schema: timeline')
check(types.includes('llmEnabled: false'), 'Schema: llm disabled')
check(types.includes("sideEffects: 'NONE'"), 'Schema: sideEffects NONE')

check(catalog.includes('SCENARIO_CATALOG'), 'Catalog present')
check(sim.includes('simulateScenario'), 'Simulator: simulate')
check(sim.includes('deriveBaseline'), 'Simulator: baseline')
check(svc.includes('runManufacturingPlanning'), 'Consumes planning')
check(svc.includes('runManufacturingReasoning'), 'Consumes reasoning')
check(svc.includes('runManufacturingSimulation'), 'Orchestrator')
check(svc.includes('buildComparison'), 'Comparison builder')
check(!svc.includes('.command'), 'No command paths')
check(!svc.toLowerCase().includes('openai'), 'No OpenAI')
check(pages.includes('Timeline visualization'), 'UI: timeline viz')

check(router.includes('/brain-simulation'), 'Router: /brain-simulation')
check(router.includes('BrainSimulationCoveragePage'), 'Router: coverage')
check(nav.includes('/brain-simulation/coverage'), 'Nav: simulation')
check(iam.includes("prefix: '/brain-simulation'"), 'IAM: brain-simulation')
check(keys.includes('brainSimulation'), 'Query keys')
check(pkg.includes('validate:manufacturing-simulation'), 'package.json validate')
check(
  /validate:manufacturing-simulation/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build runs validate:manufacturing-simulation',
)
check(arch.includes('Simulation'), 'Docs: architecture')
check(arch.includes('no LLM') || arch.includes('No LLM'), 'Docs: no LLM')
check(coverage.includes('Coverage'), 'Docs: coverage')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
