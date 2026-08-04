#!/usr/bin/env node
/**
 * Manufacturing Reasoning Engine validation — no LLM, Freeze-safe, read-only.
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

console.log('=== Manufacturing Reasoning Engine Validation ===\n')

const files = [
  'src/domain/brain/manufacturing-reasoning/types.ts',
  'src/domain/brain/manufacturing-reasoning/fact-engine.ts',
  'src/domain/brain/manufacturing-reasoning/rule-engine.ts',
  'src/domain/brain/manufacturing-reasoning/constraint-engine.ts',
  'src/domain/brain/manufacturing-reasoning/decision-engine.ts',
  'src/domain/brain/manufacturing-reasoning/recommendation-engine.ts',
  'src/domain/brain/manufacturing-reasoning/reasoning.service.ts',
  'src/domain/brain/manufacturing-reasoning/index.ts',
  'src/application/brain-reasoning/brain-reasoning.application-service.ts',
  'src/application/brain-reasoning/use-brain-reasoning.ts',
  'src/modules/brain-reasoning/layout/BrainReasoningLayout.tsx',
  'src/modules/brain-reasoning/pages/BrainReasoningPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const types = read('src/domain/brain/manufacturing-reasoning/types.ts')
const facts = read('src/domain/brain/manufacturing-reasoning/fact-engine.ts')
const rules = read('src/domain/brain/manufacturing-reasoning/rule-engine.ts')
const constraints = read('src/domain/brain/manufacturing-reasoning/constraint-engine.ts')
const decisions = read('src/domain/brain/manufacturing-reasoning/decision-engine.ts')
const recs = read('src/domain/brain/manufacturing-reasoning/recommendation-engine.ts')
const svc = read('src/domain/brain/manufacturing-reasoning/reasoning.service.ts')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const arch = exists('../docs/architecture/MANUFACTURING-REASONING-ENGINE-ARCHITECTURE.md')
  ? read('../docs/architecture/MANUFACTURING-REASONING-ENGINE-ARCHITECTURE.md')
  : ''
const coverage = exists('../docs/architecture/MANUFACTURING-REASONING-COVERAGE-REPORT.md')
  ? read('../docs/architecture/MANUFACTURING-REASONING-COVERAGE-REPORT.md')
  : ''

check(types.includes('RuleVerdict'), 'Schema: RuleVerdict')
check(types.includes("'PASS'"), 'Schema: PASS verdict')
check(types.includes("'WARNING'"), 'Schema: WARNING verdict')
check(types.includes("'CRITICAL'"), 'Schema: CRITICAL verdict')
check(types.includes("'BLOCKED'"), 'Schema: BLOCKED verdict')
check(types.includes('BrainFact'), 'Schema: BrainFact')
check(types.includes('Recommendation'), 'Schema: Recommendation')
check(types.includes('confidence'), 'Schema: recommendation confidence')
check(types.includes('llmEnabled: false'), 'Schema: llm disabled')
check(types.includes("sideEffects: 'NONE'"), 'Schema: sideEffects NONE')

check(facts.includes('collectManufacturingFacts'), 'Fact Engine: collect')
check(facts.includes('queryAllBalances'), 'Fact Engine: inventory')
check(facts.includes('queryAllSalesOrders'), 'Fact Engine: sales orders')
check(facts.includes('queryLatestMrpRun'), 'Fact Engine: MRP')
check(facts.includes('queryAllPurchaseOrders'), 'Fact Engine: purchasing')
check(facts.includes('listHoldQueue'), 'Fact Engine: quality')
check(facts.includes('queryAllShipments'), 'Fact Engine: shipment')
check(facts.includes('queryFinanceIntegrationBrainReadModel'), 'Fact Engine: finance')
check(facts.includes('queryCostClosingBrainReadModel'), 'Fact Engine: cost closing')
check(facts.includes('queryStyleClosingBrainReadModel'), 'Fact Engine: style closing')
check(!facts.includes('.command'), 'Fact Engine: no command paths')

check(rules.includes('evaluateBusinessRules'), 'Rule Engine: evaluate')
check(constraints.includes('evaluateConstraints'), 'Constraint Engine: evaluate')
check(decisions.includes('runDecisionEngine'), 'Decision Engine: run')
check(recs.includes('buildRecommendations'), 'Recommendation Engine: build')
check(recs.includes('Never mutates') || recs.includes('never mutates'), 'Recommendation: no mutate stated')
check(svc.includes('runManufacturingReasoning'), 'Orchestrator: run')
check(svc.includes('evaluateFormula'), 'Formula Engine wired')
check(svc.includes('queryConceptNeighbors'), 'Graph traverse wired')

check(!svc.toLowerCase().includes('openai'), 'No OpenAI')
check(!svc.toLowerCase().includes('anthropic'), 'No Anthropic')
check(!svc.toLowerCase().includes('gemini'), 'No Gemini')
check(!recs.toLowerCase().includes('prompt'), 'No prompt engineering')

check(router.includes('/brain-reasoning'), 'Router: /brain-reasoning')
check(router.includes('BrainReasoningCoveragePage'), 'Router: coverage page')
check(nav.includes('/brain-reasoning/coverage'), 'Nav: reasoning coverage')
check(iam.includes("prefix: '/brain-reasoning'"), 'IAM: brain-reasoning route')
check(keys.includes('brainReasoning'), 'Query keys: brainReasoning')
check(pkg.includes('validate:manufacturing-reasoning'), 'package.json: validate script')
check(
  /validate:manufacturing-reasoning/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build runs validate:manufacturing-reasoning',
)
check(arch.includes('Reasoning'), 'Docs: architecture report')
check(arch.includes('no LLM') || arch.includes('No LLM'), 'Docs: no LLM stated')
check(coverage.includes('Coverage'), 'Docs: coverage report')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
