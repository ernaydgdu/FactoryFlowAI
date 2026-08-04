/**
 * Kepler Brain — Manufacturing Knowledge Engine schemas.
 * Structured industrial knowledge only. No LLM. No chat. No prompts.
 *
 * Pipeline (this phase implements Knowledge; later layers consume it):
 * Knowledge → Reasoning → Planning → Decision → Recommendation → Automation
 */

export const MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION = 1 as const

/** Knowledge categories (Step 1). */
export type KnowledgeCategory =
  | 'TextileTerminology'
  | 'ManufacturingConcepts'
  | 'BusinessRules'
  | 'CalculationFormulae'
  | 'ProductionFlows'
  | 'MachineLibrary'
  | 'OperationLibrary'
  | 'QualityRules'
  | 'PlanningRules'
  | 'InventoryRules'
  | 'PurchasingRules'
  | 'WarehouseRules'
  | 'ShipmentRules'
  | 'CostRules'
  | 'FinanceRules'
  | 'KpiLibrary'
  | 'DecisionRules'
  | 'ExpertHeuristics'
  | 'AiReasoningRules'

export type KnowledgeRelationType =
  | 'REQUIRES'
  | 'PRODUCES'
  | 'CONSUMES'
  | 'PRECEDES'
  | 'ENABLES'
  | 'CONSTRAINS'
  | 'MEASURES'
  | 'APPLIES_TO'
  | 'USES_MACHINE'
  | 'USES_OPERATION'
  | 'TRIGGERS_DECISION'
  | 'RELATED'

/** Knowledge graph node (Step 2) — concepts as connected entities. */
export type KnowledgeConceptNode = {
  id: string
  label: string
  category: KnowledgeCategory
  definition: string
  moduleRefs: string[]
  tags: string[]
}

export type KnowledgeConceptEdge = {
  id: string
  fromId: string
  toId: string
  relation: KnowledgeRelationType
  label?: string
}

export type ManufacturingKnowledgeGraph = {
  schemaVersion: typeof MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION
  nodes: KnowledgeConceptNode[]
  edges: KnowledgeConceptEdge[]
  rootConceptIds: string[]
}

/** Formula library (Step 3) — executable metadata, not documents. */
export type FormulaParameter = {
  name: string
  unit?: string
  required: boolean
  description: string
}

export type FormulaDefinition = {
  id: string
  code: string
  name: string
  category: KnowledgeCategory
  expression: string
  /** Deterministic evaluator key — no arbitrary eval. */
  evaluatorId: string
  parameters: FormulaParameter[]
  resultUnit: string
  relatedConcepts: string[]
  explanation: string
}

export type FormulaEvaluationInput = Record<string, number>
export type FormulaEvaluationResult = {
  formulaId: string
  ok: boolean
  value: number | null
  unit: string
  missingParameters: string[]
  explanation: string
}

/** Business rule library (Step 4) — machine-readable. */
export type BusinessRuleOperator =
  | 'EQ'
  | 'NE'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'IS_TRUE'
  | 'IS_FALSE'

export type BusinessRuleCondition = {
  field: string
  operator: BusinessRuleOperator
  value?: string | number | boolean
}

export type BusinessRuleActionType =
  | 'ALLOW'
  | 'REJECT'
  | 'ALERT'
  | 'BLOCK_MACHINE'
  | 'BLOCK_SHIPMENT'
  | 'SUGGEST'
  | 'REQUIRE_LOT_FIFO'

export type BusinessRuleAction = {
  type: BusinessRuleActionType
  message: string
  target?: string
}

export type BusinessRuleDefinition = {
  id: string
  code: string
  name: string
  category: KnowledgeCategory
  when: BusinessRuleCondition[]
  then: BusinessRuleAction[]
  relatedConcepts: string[]
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  explanation: string
}

/** Textile dictionary entry (Step 5). */
export type DictionaryEntry = {
  id: string
  term: string
  category: KnowledgeCategory
  definition: string
  relatedModules: string[]
  relatedConcepts: string[]
  typicalCalculations: string[]
  typicalDecisions: string[]
  aliases: string[]
}

/** Production flow library (Step 6). */
export type ProductionFlowStep = {
  id: string
  sequence: number
  conceptId: string
  label: string
  moduleRef?: string
}

export type ProductionFlowDefinition = {
  id: string
  code: string
  name: string
  description: string
  steps: ProductionFlowStep[]
}

/** Decision library (Step 7) — expert manufacturing decisions. */
export type DecisionStep = {
  id: string
  sequence: number
  action: string
  conceptId?: string
  outcomeHint: string
}

export type DecisionDefinition = {
  id: string
  code: string
  trigger: string
  name: string
  category: KnowledgeCategory
  steps: DecisionStep[]
  relatedConcepts: string[]
  relatedKpis: string[]
}

/** Machine library (Step 8). */
export type MachineDefinition = {
  id: string
  code: string
  name: string
  capabilities: string[]
  supportedOperations: string[]
  setupTimeMinutes: number
  maintenanceRules: string[]
  capacityUnitsPerHour: number
  relatedOperations: string[]
  relatedConcepts: string[]
}

/** Operation library (paired with machines). */
export type OperationDefinition = {
  id: string
  code: string
  name: string
  description: string
  typicalMachines: string[]
  relatedConcepts: string[]
}

/** KPI knowledge (Step 9). */
export type KpiDefinition = {
  id: string
  code: string
  name: string
  formulaId: string
  target: number
  warningLevel: number
  criticalLevel: number
  unit: string
  higherIsBetter: boolean
  recommendationLogic: string
  relatedConcepts: string[]
}

/** Reasoning schema stubs (consumed by later Brain layers — no LLM). */
export type ReasoningPrimitive =
  | 'MATCH_RULE'
  | 'EVAL_FORMULA'
  | 'TRAVERSE_GRAPH'
  | 'APPLY_DECISION_TREE'
  | 'SCORE_KPI'

export type ReasoningPlanStep = {
  id: string
  primitive: ReasoningPrimitive
  inputRefs: string[]
  outputRef: string
  description: string
}

export type ReasoningSchema = {
  schemaVersion: typeof MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION
  primitives: ReasoningPrimitive[]
  samplePlans: Array<{
    id: string
    name: string
    steps: ReasoningPlanStep[]
  }>
  llmEnabled: false
  sideEffects: 'NONE'
}

export type ManufacturingKnowledgeCoverage = {
  schemaVersion: typeof MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION
  categories: Array<{ category: KnowledgeCategory; count: number }>
  totals: {
    concepts: number
    edges: number
    formulae: number
    businessRules: number
    dictionary: number
    flows: number
    decisions: number
    machines: number
    operations: number
    kpis: number
  }
  pipeline: readonly [
    'Knowledge',
    'Reasoning',
    'Planning',
    'Decision',
    'Recommendation',
    'Automation',
  ]
  implementedLayers: readonly ['Knowledge']
  llmEnabled: false
}

export type ManufacturingKnowledgeSnapshot = {
  schemaVersion: typeof MANUFACTURING_KNOWLEDGE_SCHEMA_VERSION
  graph: ManufacturingKnowledgeGraph
  formulae: FormulaDefinition[]
  businessRules: BusinessRuleDefinition[]
  dictionary: DictionaryEntry[]
  flows: ProductionFlowDefinition[]
  decisions: DecisionDefinition[]
  machines: MachineDefinition[]
  operations: OperationDefinition[]
  kpis: KpiDefinition[]
  reasoning: ReasoningSchema
  coverage: ManufacturingKnowledgeCoverage
}
