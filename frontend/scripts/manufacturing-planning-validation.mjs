#!/usr/bin/env node
/**
 * Manufacturing Planning Engine validation — no LLM, Freeze-safe, read-only plans.
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

console.log('=== Manufacturing Planning Engine Validation ===\n')

const files = [
  'src/domain/brain/manufacturing-planning/types.ts',
  'src/domain/brain/manufacturing-planning/sequencing-allocation.ts',
  'src/domain/brain/manufacturing-planning/impact-analysis.ts',
  'src/domain/brain/manufacturing-planning/plan-builder.ts',
  'src/domain/brain/manufacturing-planning/planning.service.ts',
  'src/domain/brain/manufacturing-planning/index.ts',
  'src/application/brain-planning/brain-planning.application-service.ts',
  'src/application/brain-planning/use-brain-planning.ts',
  'src/modules/brain-planning/layout/BrainPlanningLayout.tsx',
  'src/modules/brain-planning/pages/BrainPlanningPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const types = read('src/domain/brain/manufacturing-planning/types.ts')
const seq = read('src/domain/brain/manufacturing-planning/sequencing-allocation.ts')
const impact = read('src/domain/brain/manufacturing-planning/impact-analysis.ts')
const builder = read('src/domain/brain/manufacturing-planning/plan-builder.ts')
const svc = read('src/domain/brain/manufacturing-planning/planning.service.ts')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const arch = exists('../docs/architecture/MANUFACTURING-PLANNING-ENGINE-ARCHITECTURE.md')
  ? read('../docs/architecture/MANUFACTURING-PLANNING-ENGINE-ARCHITECTURE.md')
  : ''
const coverage = exists('../docs/architecture/MANUFACTURING-PLANNING-COVERAGE-REPORT.md')
  ? read('../docs/architecture/MANUFACTURING-PLANNING-COVERAGE-REPORT.md')
  : ''

check(types.includes('PlanVariant'), 'Schema: PlanVariant')
check(types.includes("'A'"), 'Schema: Plan A')
check(types.includes("'B'"), 'Schema: Plan B')
check(types.includes("'C'"), 'Schema: Plan C')
check(types.includes('ProductionSequenceStep'), 'Schema: sequencing')
check(types.includes('CapacityAllocation'), 'Schema: capacity')
check(types.includes('MachineAllocation'), 'Schema: machines')
check(types.includes('OperatorAllocation'), 'Schema: operators')
check(types.includes('MaterialAllocation'), 'Schema: materials')
check(types.includes('PurchasingSuggestion'), 'Schema: purchasing')
check(types.includes('ShipmentImpact'), 'Schema: shipment impact')
check(types.includes('DeliveryRisk'), 'Schema: delivery risk')
check(types.includes('CriticalPathNode'), 'Schema: critical path')
check(types.includes('BottleneckAnalysis'), 'Schema: bottlenecks')
check(types.includes('PlanExplanation'), 'Schema: explanation')
check(types.includes('confidence'), 'Schema: confidence')
check(types.includes('llmEnabled: false'), 'Schema: llm disabled')
check(types.includes("sideEffects: 'NONE'"), 'Schema: sideEffects NONE')
check(types.includes('assumptions'), 'Explanation: assumptions')
check(types.includes('constraintsEvaluated'), 'Explanation: constraints')
check(types.includes('kpisImproved'), 'Explanation: KPIs')
check(types.includes('risksRemaining'), 'Explanation: risks')

check(seq.includes('buildSequencing'), 'Sequencing builder')
check(seq.includes('buildCapacityAllocation'), 'Capacity allocation')
check(seq.includes('buildMachineAllocation'), 'Machine allocation')
check(seq.includes('buildOperatorAllocation'), 'Operator allocation')
check(seq.includes('buildMaterialAllocation'), 'Material allocation')
check(impact.includes('buildPurchasingSuggestions'), 'Purchasing suggestions')
check(impact.includes('buildShipmentImpact'), 'Shipment impact')
check(impact.includes('buildDeliveryRisks'), 'Delivery risk')
check(impact.includes('buildCriticalPath'), 'Critical path')
check(impact.includes('buildBottlenecks'), 'Bottlenecks')
check(builder.includes('buildPlan'), 'Plan builder')
check(svc.includes('runManufacturingReasoning'), 'Consumes reasoning')
check(svc.includes('runManufacturingPlanning'), 'Orchestrator')
check(!svc.includes('.command'), 'No command paths')
check(!svc.toLowerCase().includes('openai'), 'No OpenAI')
check(!builder.toLowerCase().includes('prompt'), 'No prompts')

check(router.includes('/brain-planning'), 'Router: /brain-planning')
check(router.includes('BrainPlanningCoveragePage'), 'Router: coverage page')
check(nav.includes('/brain-planning/coverage'), 'Nav: planning coverage')
check(iam.includes("prefix: '/brain-planning'"), 'IAM: brain-planning')
check(keys.includes('brainPlanning'), 'Query keys: brainPlanning')
check(pkg.includes('validate:manufacturing-planning'), 'package.json: validate script')
check(
  /validate:manufacturing-planning/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build runs validate:manufacturing-planning',
)
check(arch.includes('Planning'), 'Docs: architecture')
check(arch.includes('no LLM') || arch.includes('No LLM'), 'Docs: no LLM')
check(coverage.includes('Coverage'), 'Docs: coverage')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
