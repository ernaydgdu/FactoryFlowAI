/**
 * Kepler Brain — Manufacturing Reasoning Engine schemas.
 * Industrial inference only. No LLM. No chat. No prompts. No ERP mutation.
 *
 * Pipeline:
 * Facts → Knowledge Graph → Business Rules → Formula → Constraint → Decision → Recommendation
 */

export const MANUFACTURING_REASONING_SCHEMA_VERSION = 1 as const

export type RuleVerdict = 'PASS' | 'WARNING' | 'CRITICAL' | 'BLOCKED'

export type FactSourceModule =
  | 'sales-order'
  | 'production-order'
  | 'inventory'
  | 'warehouse'
  | 'purchasing'
  | 'mrp'
  | 'quality'
  | 'shipment'
  | 'finance-integration'
  | 'cost-closing'
  | 'style-closing'
  | 'production-planning'
  | 'derived'

/** Standardized ERP fact for industrial reasoning. */
export type BrainFact = {
  id: string
  sourceModule: FactSourceModule
  subjectType: string
  subjectId: string
  label: string
  attributes: Record<string, string | number | boolean | null>
  relatedConceptIds: string[]
  collectedAt: string
}

/** Flattened numeric/boolean context used by rule & formula engines. */
export type FactContext = Record<string, number | boolean | string>

export type RuleEvaluationResult = {
  ruleId: string
  ruleCode: string
  ruleName: string
  verdict: RuleVerdict
  applicable: boolean
  matched: boolean
  message: string
  evidence: string[]
  actions: string[]
  relatedConcepts: string[]
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export type FormulaRunResult = {
  formulaId: string
  formulaCode: string
  ok: boolean
  value: number | null
  unit: string
  input: Record<string, number>
  explanation: string
  subjectId?: string
  subjectLabel?: string
}

export type ConstraintDomain =
  | 'Capacity'
  | 'Material'
  | 'Machine'
  | 'Quality'
  | 'Shipment'
  | 'Financial'

export type ConstraintCheckResult = {
  id: string
  domain: ConstraintDomain
  verdict: RuleVerdict
  title: string
  detail: string
  evidence: string[]
  affectedModules: string[]
  relatedRuleIds: string[]
  relatedFormulaIds: string[]
}

export type DecisionCandidate = {
  id: string
  action: string
  score: number
  rationale: string
  evidence: string[]
  risk: string
  affectedModules: string[]
}

export type DecisionResult = {
  decisionId: string
  decisionCode: string
  trigger: string
  name: string
  path: Array<{ stepId: string; action: string; outcome: string }>
  candidates: DecisionCandidate[]
  best: DecisionCandidate | null
  relatedConcepts: string[]
}

export type Recommendation = {
  id: string
  title: string
  reason: string
  evidence: string[]
  businessRulesUsed: string[]
  formulaeUsed: string[]
  confidence: number
  risk: string
  alternative: string | null
  affectedModules: string[]
  verdict: RuleVerdict
  decisionCode?: string
}

export type GraphTraversalHit = {
  fromConceptId: string
  fromLabel: string
  relation: string
  toConceptId: string
  toLabel: string
}

export type ReasoningCoverage = {
  schemaVersion: typeof MANUFACTURING_REASONING_SCHEMA_VERSION
  llmEnabled: false
  sideEffects: 'NONE'
  pipeline: readonly [
    'Facts',
    'KnowledgeGraph',
    'BusinessRules',
    'FormulaEngine',
    'ConstraintEngine',
    'DecisionEngine',
    'RecommendationEngine',
  ]
  implementedLayers: readonly [
    'Knowledge',
    'Reasoning',
  ]
  totals: {
    facts: number
    ruleEvaluations: number
    formulaeRun: number
    constraints: number
    decisions: number
    recommendations: number
    graphHits: number
  }
  verdictCounts: Record<RuleVerdict, number>
  sourceModules: Array<{ module: FactSourceModule; factCount: number }>
}

export type ManufacturingReasoningRun = {
  schemaVersion: typeof MANUFACTURING_REASONING_SCHEMA_VERSION
  ranAt: string
  llmEnabled: false
  sideEffects: 'NONE'
  facts: BrainFact[]
  factContext: FactContext
  graphHits: GraphTraversalHit[]
  ruleEvaluations: RuleEvaluationResult[]
  formulae: FormulaRunResult[]
  constraints: ConstraintCheckResult[]
  decisions: DecisionResult[]
  recommendations: Recommendation[]
  coverage: ReasoningCoverage
}
