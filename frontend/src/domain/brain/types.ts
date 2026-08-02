/** Kepler Brain — Enterprise Decision Platform domain types */

// --- Operation & Security ---

export type BrainOperationMode = 'READ' | 'ANALYZE' | 'RECOMMEND' | 'SIMULATE'

export type BrainForbiddenOperation =
  | 'WRITE'
  | 'EXECUTE_RULE'
  | 'EXECUTE_PLANNING'
  | 'LEDGER_MUTATION'
  | 'DATABASE_MUTATION'
  | 'EXTERNAL_FETCH'
  | 'CROSS_TENANT'
  | 'CROSS_COMPANY_LEARN'

export type BrainKnowledgeSourceId =
  | 'BUSINESS_RULE_ENGINE'
  | 'PLANNING_ENGINE'
  | 'MASTER_DATA'
  | 'STOCK_LEDGER'
  | 'TIMELINE'
  | 'APPROVAL'
  | 'AUDIT'
  | 'VERSIONING'
  | 'KPI_ENGINE'
  | 'WORKFLOW'
  | 'LOCALIZATION'
  | 'EVENT_BUS'
  | 'CONFIGURATION'
  | 'AI_MEMORY'
  | 'ENTERPRISE_RELATIONS'
  | 'PRODUCTION_PLANNING'
  | 'PRODUCTION_ORDER_LIFECYCLE'

export type BrainFocusArea =
  | 'ORDER_RISK'
  | 'CAPACITY'
  | 'STOCK'
  | 'TERMIN'
  | 'PURCHASING'
  | 'PRODUCTION'
  | 'QUALITY'
  | 'SHIPMENT'
  | 'GENERAL'

// --- Context ---

export type BrainScope = {
  entityType?: string
  entityId?: string
  orderId?: string
  orderNo?: string
  focusArea?: BrainFocusArea
}

export type BrainContext = {
  companyId: string
  userId: string
  tenantId: string
  sessionId: string
  requestedAt: string
  operationMode: BrainOperationMode
  scope: BrainScope
}

export type BrainSecurityVerdict = {
  allowed: boolean
  operationMode: BrainOperationMode
  violations: BrainForbiddenOperation[]
  tenantScoped: boolean
  offlineCapable: boolean
}

// --- Configuration ---

export type BrainConfiguration = {
  companyId: string
  enabled: boolean
  offlineFirst: boolean
  allowedSources: BrainKnowledgeSourceId[]
  allowedOperations: BrainOperationMode[]
  maxRecommendations: number
  maxSimulationsPerSession: number
  confidenceThreshold: number
  retentionDays: number
}

export type UserBrainPreferences = {
  userId: string
  companyId: string
  defaultFocusArea: BrainFocusArea
  notifyOnCriticalRecommendations: boolean
}

// --- Knowledge ---

export type BrainKnowledgeFragment = {
  sourceId: BrainKnowledgeSourceId
  fetchedAt: string
  entityKeys: string[]
  summary: string
  payload: Record<string, unknown>
  recordCount: number
}

export type BrainKnowledgeSnapshot = {
  snapshotId: string
  context: BrainContext
  fragments: BrainKnowledgeFragment[]
  assembledAt: string
  sourceCount: number
  completenessScore: number
}

// --- Memory ---

export type BrainMemoryEntry = {
  id: string
  sessionId: string
  companyId: string
  timestamp: string
  category: 'analysis' | 'recommendation' | 'simulation' | 'context'
  summary: string
  entityId?: string
  entityNo?: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
}

export type BrainSessionMemory = {
  sessionId: string
  companyId: string
  userId: string
  startedAt: string
  entries: BrainMemoryEntry[]
  analysisCount: number
  recommendationCount: number
  simulationCount: number
}

// --- Reasoning ---

export type BrainInsightSeverity = 'INFO' | 'WARNING' | 'RISK' | 'CRITICAL'

export type BrainInsight = {
  id: string
  code: string
  severity: BrainInsightSeverity
  title: string
  description: string
  evidenceSources: BrainKnowledgeSourceId[]
  relatedEntityId?: string
  relatedEntityNo?: string
  metrics?: Record<string, number | string>
}

export type BrainAnalysisResult = {
  analysisId: string
  context: BrainContext
  snapshotId: string
  insights: BrainInsight[]
  generatedAt: string
  reasoningNotes: string[]
  /** Chapter 2 — genişletilmiş reasoning çıktısı */
  reasoningOutput?: import('./types/knowledge-reasoning').BrainReasoningOutput
}

// --- Decision ---

export type DecisionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type DecisionOption = {
  id: string
  label: string
  description: string
  impactSummary: string
  riskLevel: DecisionRiskLevel
  requiresApproval: boolean
  estimatedCostImpact?: number
  estimatedDelayDays?: number
}

export type DecisionFrame = {
  id: string
  question: string
  context: string
  focusArea: BrainFocusArea
  options: DecisionOption[]
  constraints: string[]
  dataSources: BrainKnowledgeSourceId[]
  analysisId: string
  generatedAt: string
  /** Son karar her zaman kullanıcıya aittir */
  finalDecisionOwner: 'USER'
}

// --- Recommendation ---

export type BrainRecommendationType =
  | 'TERMIN_RISK_MITIGATION'
  | 'CAPACITY_REALLOCATION'
  | 'STOCK_REPLENISHMENT'
  | 'PURCHASING_PRIORITY'
  | 'PRODUCTION_SEQUENCE'
  | 'QUALITY_ESCALATION'
  | 'SHIPMENT_RESCHEDULE'
  | 'APPROVAL_FOLLOWUP'

export type BrainEvidence = {
  sourceId: BrainKnowledgeSourceId
  reference: string
  fact: string
  value?: string | number
}

export type BrainRecommendation = {
  id: string
  type: BrainRecommendationType
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  rationale: string
  evidence: BrainEvidence[]
  suggestedActions: string[]
  confidence: number
  disclaimers: string[]
  decisionFrameId?: string
  relatedOrderId?: string
  relatedOrderNo?: string
  generatedAt: string
  finalDecisionBy: 'USER'
}

// --- Simulation ---

export type SimulationParameterType = 'NUMBER' | 'PERCENT' | 'DAYS' | 'QUANTITY' | 'BOOLEAN'

export type SimulationParameter = {
  key: string
  label: string
  type: SimulationParameterType
  baseValue: number | boolean
  simulatedValue: number | boolean
  unit?: string
}

export type SimulationScenario = {
  id: string
  name: string
  hypothesis: string
  focusArea: BrainFocusArea
  baseSnapshotId: string
  parameters: SimulationParameter[]
  createdAt: string
}

export type SimulationOutcome = {
  metric: string
  baseValue: number | string
  simulatedValue: number | string
  delta: number | string
  unit?: string
}

export type SimulationResult = {
  scenarioId: string
  scenarioName: string
  projectedOutcomes: SimulationOutcome[]
  risks: string[]
  assumptions: string[]
  disclaimer: string
  generatedAt: string
  /** Simülasyon gerçek işlem yapmaz */
  sideEffects: 'NONE'
}

// --- Kernel Output ---

export type BrainPipelineStage =
  | 'SECURITY'
  | 'CONFIGURATION'
  | 'KNOWLEDGE'
  | 'KNOWLEDGE_GRAPH'
  | 'FACTS'
  | 'MEMORY'
  | 'REASONING'
  | 'ALTERNATIVES'
  | 'DECISION'
  | 'RECOMMENDATION'
  | 'SIMULATION'
  | 'DIGITAL_TWIN'
  | 'BRAIN_HEALTH'

export type BrainPipelineResult = {
  requestId: string
  context: BrainContext
  security: BrainSecurityVerdict
  configuration: BrainConfiguration
  knowledge?: BrainKnowledgeSnapshot
  analysis?: BrainAnalysisResult
  decisionFrames?: DecisionFrame[]
  recommendations?: BrainRecommendation[]
  simulation?: SimulationResult
  twinIntelligence?: import('./twin/types').DigitalTwinIntelligenceOutput
  completedStages: BrainPipelineStage[]
  generatedAt: string
  offline: boolean
}
