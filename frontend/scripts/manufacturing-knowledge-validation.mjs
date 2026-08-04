#!/usr/bin/env node
/**
 * Manufacturing Knowledge Engine validation — no LLM, Freeze-safe catalog.
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

console.log('=== Manufacturing Knowledge Engine Validation ===\n')

const files = [
  'src/domain/brain/manufacturing-knowledge/types.ts',
  'src/domain/brain/manufacturing-knowledge/catalog.ts',
  'src/domain/brain/manufacturing-knowledge/query.service.ts',
  'src/domain/brain/manufacturing-knowledge/index.ts',
  'src/application/brain-knowledge/brain-knowledge.application-service.ts',
  'src/application/brain-knowledge/use-brain-knowledge.ts',
  'src/modules/brain-knowledge/layout/BrainKnowledgeLayout.tsx',
  'src/modules/brain-knowledge/pages/BrainKnowledgePages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const types = read('src/domain/brain/manufacturing-knowledge/types.ts')
const catalog = read('src/domain/brain/manufacturing-knowledge/catalog.ts')
const query = read('src/domain/brain/manufacturing-knowledge/query.service.ts')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const arch = exists('../docs/architecture/MANUFACTURING-KNOWLEDGE-ENGINE-ARCHITECTURE.md')
  ? read('../docs/architecture/MANUFACTURING-KNOWLEDGE-ENGINE-ARCHITECTURE.md')
  : ''
const coverage = exists('../docs/architecture/MANUFACTURING-KNOWLEDGE-COVERAGE-REPORT.md')
  ? read('../docs/architecture/MANUFACTURING-KNOWLEDGE-COVERAGE-REPORT.md')
  : ''

const categories = [
  'TextileTerminology',
  'ManufacturingConcepts',
  'BusinessRules',
  'CalculationFormulae',
  'ProductionFlows',
  'MachineLibrary',
  'OperationLibrary',
  'QualityRules',
  'PlanningRules',
  'InventoryRules',
  'PurchasingRules',
  'WarehouseRules',
  'ShipmentRules',
  'CostRules',
  'FinanceRules',
  'KpiLibrary',
  'DecisionRules',
  'ExpertHeuristics',
  'AiReasoningRules',
]
for (const c of categories) check(types.includes(`'${c}'`), `Schema category: ${c}`)

check(types.includes('FormulaDefinition'), 'Schema: FormulaDefinition')
check(types.includes('BusinessRuleDefinition'), 'Schema: BusinessRuleDefinition')
check(types.includes('DictionaryEntry'), 'Schema: DictionaryEntry')
check(types.includes('ManufacturingKnowledgeGraph'), 'Schema: Knowledge Graph')
check(types.includes('ReasoningSchema'), 'Schema: ReasoningSchema')
check(types.includes('llmEnabled: false') || types.includes('llmEnabled: false'), 'Schema: llm disabled')
check(query.includes('evaluateFormula'), 'Query: evaluateFormula')
check(query.includes('queryManufacturingKnowledgeCoverage'), 'Query: coverage')
check(catalog.includes('FORMULAE'), 'Catalog: formulae')
check(catalog.includes('BUSINESS_RULES'), 'Catalog: business rules')
check(catalog.includes('DICTIONARY'), 'Catalog: dictionary')
check(catalog.includes('FLOWS'), 'Catalog: flows')
check(catalog.includes('DECISIONS'), 'Catalog: decisions')
check(catalog.includes('MACHINES'), 'Catalog: machines')
check(catalog.includes('KPIS'), 'Catalog: KPIs')
check(catalog.includes('KNOWLEDGE_EDGES'), 'Catalog: graph edges')
check(!catalog.includes('openai') && !catalog.includes('anthropic'), 'No external LLM vendor')
check(router.includes('/brain-knowledge'), 'Router: /brain-knowledge')
check(router.includes('BrainKnowledgeCoveragePage'), 'Router: coverage page')
check(nav.includes('/brain-knowledge/coverage'), 'Nav: knowledge coverage')
check(iam.includes("prefix: '/brain-knowledge'"), 'IAM: brain-knowledge route')
check(keys.includes('brainKnowledge'), 'Query keys: brainKnowledge')
check(pkg.includes('validate:manufacturing-knowledge'), 'package.json: validate script')
check(
  /validate:manufacturing-knowledge/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build runs validate:manufacturing-knowledge',
)
check(arch.includes('Knowledge'), 'Docs: architecture report')
check(arch.includes('no LLM') || arch.includes('No LLM'), 'Docs: no LLM stated')
check(coverage.includes('Coverage'), 'Docs: coverage report')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
