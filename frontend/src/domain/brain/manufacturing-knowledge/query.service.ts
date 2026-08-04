/**
 * Manufacturing Knowledge Engine — query + deterministic formula evaluation.
 * Read-only knowledge surface. No LLM. No ERP module mutation.
 */
import {
  BUSINESS_RULES,
  DECISIONS,
  DICTIONARY,
  FLOWS,
  FORMULAE,
  KNOWLEDGE_CONCEPTS,
  KNOWLEDGE_EDGES,
  KPIS,
  MACHINES,
  OPERATIONS,
  REASONING_SCHEMA,
} from './catalog'
import type {
  BusinessRuleDefinition,
  DecisionDefinition,
  DictionaryEntry,
  FormulaDefinition,
  FormulaEvaluationInput,
  FormulaEvaluationResult,
  KnowledgeCategory,
  KnowledgeConceptEdge,
  KnowledgeConceptNode,
  ManufacturingKnowledgeCoverage,
  ManufacturingKnowledgeGraph,
  ManufacturingKnowledgeSnapshot,
  ProductionFlowDefinition,
} from './types'
import { MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION } from './types'

const ALL_CATEGORIES: KnowledgeCategory[] = [
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

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return a / b
}

export function queryManufacturingKnowledgeGraph(): ManufacturingKnowledgeGraph {
  return {
    schemaVersion: MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION,
    nodes: KNOWLEDGE_CONCEPTS,
    edges: KNOWLEDGE_EDGES,
    rootConceptIds: ['c-order', 'c-cotton'],
  }
}

export function queryConceptById(id: string): KnowledgeConceptNode | undefined {
  return KNOWLEDGE_CONCEPTS.find((c) => c.id === id)
}

export function queryConceptNeighbors(conceptId: string): {
  concept: KnowledgeConceptNode | undefined
  outbound: Array<{ edge: KnowledgeConceptEdge; node: KnowledgeConceptNode }>
  inbound: Array<{ edge: KnowledgeConceptEdge; node: KnowledgeConceptNode }>
} {
  const concept = queryConceptById(conceptId)
  const byId = new Map(KNOWLEDGE_CONCEPTS.map((c) => [c.id, c]))
  const outbound = KNOWLEDGE_EDGES.filter((e) => e.fromId === conceptId)
    .map((edge) => {
      const node = byId.get(edge.toId)
      return node ? { edge, node } : null
    })
    .filter((x): x is { edge: KnowledgeConceptEdge; node: KnowledgeConceptNode } => !!x)
  const inbound = KNOWLEDGE_EDGES.filter((e) => e.toId === conceptId)
    .map((edge) => {
      const node = byId.get(edge.fromId)
      return node ? { edge, node } : null
    })
    .filter((x): x is { edge: KnowledgeConceptEdge; node: KnowledgeConceptNode } => !!x)
  return { concept, outbound, inbound }
}

export function queryFormulae(): FormulaDefinition[] {
  return FORMULAE
}

export function queryFormulaByCode(code: string): FormulaDefinition | undefined {
  return FORMULAE.find((f) => f.code === code || f.id === code)
}

export function evaluateFormula(
  formulaIdOrCode: string,
  input: FormulaEvaluationInput,
): FormulaEvaluationResult {
  const formula = queryFormulaByCode(formulaIdOrCode)
  if (!formula) {
    return {
      formulaId: formulaIdOrCode,
      ok: false,
      value: null,
      unit: '',
      missingParameters: [],
      explanation: 'Unknown formula',
    }
  }
  const missing = formula.parameters
    .filter((p) => p.required && (input[p.name] === undefined || Number.isNaN(input[p.name]!)))
    .map((p) => p.name)
  if (missing.length) {
    return {
      formulaId: formula.id,
      ok: false,
      value: null,
      unit: formula.resultUnit,
      missingParameters: missing,
      explanation: formula.explanation,
    }
  }

  let value: number | null = null
  switch (formula.evaluatorId) {
    case 'div': {
      const keys = formula.parameters.map((p) => p.name)
      value = safeDiv(input[keys[0]!]!, input[keys[1]!]!)
      break
    }
    case 'top_end':
      value = input.rollLength! - input.markerLength! * input.layers!
      break
    case 'mrp_net':
      value = input.gross! - input.stock! - input.openPO! - input.openProduction!
      break
    case 'product3':
      value = input.availability! * input.performance! * input.quality!
      break
    default:
      value = null
  }

  return {
    formulaId: formula.id,
    ok: value !== null && Number.isFinite(value),
    value,
    unit: formula.resultUnit,
    missingParameters: [],
    explanation: formula.explanation,
  }
}

export function queryBusinessRules(): BusinessRuleDefinition[] {
  return BUSINESS_RULES
}

export function queryDictionary(search?: string): DictionaryEntry[] {
  if (!search?.trim()) return DICTIONARY
  const q = search.trim().toLowerCase()
  return DICTIONARY.filter(
    (d) =>
      d.term.toLowerCase().includes(q) ||
      d.definition.toLowerCase().includes(q) ||
      d.aliases.some((a) => a.toLowerCase().includes(q)),
  )
}

export function queryProductionFlows(): ProductionFlowDefinition[] {
  return FLOWS
}

export function queryFlowByCode(code: string): ProductionFlowDefinition | undefined {
  return FLOWS.find((f) => f.code === code || f.id === code)
}

export function queryDecisions(): DecisionDefinition[] {
  return DECISIONS
}

export function queryMachines() {
  return MACHINES
}

export function queryOperations() {
  return OPERATIONS
}

export function queryKpis() {
  return KPIS
}

export function queryManufacturingKnowledgeCoverage(): ManufacturingKnowledgeCoverage {
  const categoryBuckets = new Map<KnowledgeCategory, number>()
  for (const cat of ALL_CATEGORIES) categoryBuckets.set(cat, 0)

  const bump = (cat: KnowledgeCategory, n = 1) =>
    categoryBuckets.set(cat, (categoryBuckets.get(cat) ?? 0) + n)

  for (const c of KNOWLEDGE_CONCEPTS) bump(c.category)
  for (const f of FORMULAE) bump(f.category)
  for (const r of BUSINESS_RULES) bump(r.category)
  for (const d of DICTIONARY) bump(d.category)
  for (const _ of FLOWS) bump('ProductionFlows')
  for (const d of DECISIONS) bump(d.category)
  for (const _ of MACHINES) bump('MachineLibrary')
  for (const _ of OPERATIONS) bump('OperationLibrary')
  for (const _ of KPIS) bump('KpiLibrary')
  bump('ExpertHeuristics', DECISIONS.length)
  bump('AiReasoningRules', REASONING_SCHEMA.samplePlans.length)

  return {
    schemaVersion: MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION,
    categories: ALL_CATEGORIES.map((category) => ({
      category,
      count: categoryBuckets.get(category) ?? 0,
    })),
    totals: {
      concepts: KNOWLEDGE_CONCEPTS.length,
      edges: KNOWLEDGE_EDGES.length,
      formulae: FORMULAE.length,
      businessRules: BUSINESS_RULES.length,
      dictionary: DICTIONARY.length,
      flows: FLOWS.length,
      decisions: DECISIONS.length,
      machines: MACHINES.length,
      operations: OPERATIONS.length,
      kpis: KPIS.length,
    },
    pipeline: ['Knowledge', 'Reasoning', 'Planning', 'Decision', 'Recommendation', 'Automation'],
    implementedLayers: ['Knowledge'],
    llmEnabled: false,
  }
}

export function queryManufacturingKnowledgeSnapshot(): ManufacturingKnowledgeSnapshot {
  return {
    schemaVersion: MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION,
    graph: queryManufacturingKnowledgeGraph(),
    formulae: FORMULAE,
    businessRules: BUSINESS_RULES,
    dictionary: DICTIONARY,
    flows: FLOWS,
    decisions: DECISIONS,
    machines: MACHINES,
    operations: OPERATIONS,
    kpis: KPIS,
    reasoning: REASONING_SCHEMA,
    coverage: queryManufacturingKnowledgeCoverage(),
  }
}
