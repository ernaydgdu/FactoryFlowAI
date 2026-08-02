/** Kepler Brain Chapter 2 — Knowledge & Reasoning domain types */

import type { BrainEvidence, BrainFocusArea, BrainKnowledgeSourceId } from '../types'

// --- Knowledge Graph ---

export type KnowledgeGraphNodeType =
  | 'ORDER'
  | 'PRODUCT'
  | 'BOM'
  | 'MRP'
  | 'PURCHASE'
  | 'WAREHOUSE'
  | 'PRODUCTION'
  | 'QUALITY'
  | 'SHIPMENT'
  | 'COST'
  | 'PROFITABILITY'

export type KnowledgeGraphEdgeType =
  | 'HAS_PRODUCT'
  | 'HAS_BOM'
  | 'REQUIRES_MRP'
  | 'TRIGGERS_PURCHASE'
  | 'STORED_IN'
  | 'FEEDS_PRODUCTION'
  | 'PASSES_QUALITY'
  | 'SHIPPED_TO'
  | 'HAS_COST'
  | 'CONTRIBUTES_PROFIT'

export type DataQualityLevel = 'COMPLETE' | 'PARTIAL' | 'MISSING'

export type KnowledgeGraphNode = {
  id: string
  type: KnowledgeGraphNodeType
  label: string
  entityId?: string
  sourceId: BrainKnowledgeSourceId
  attributes: Record<string, unknown>
  dataQuality: DataQualityLevel
}

export type KnowledgeGraphEdge = {
  id: string
  fromNodeId: string
  toNodeId: string
  type: KnowledgeGraphEdgeType
  sourceId: BrainKnowledgeSourceId
  label?: string
}

export type MissingDataFlag = {
  code: string
  nodeType: KnowledgeGraphNodeType
  field: string
  message: string
  sourceId: BrainKnowledgeSourceId
}

export type KnowledgeGraph = {
  graphId: string
  snapshotId: string
  rootNodeId?: string
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  completenessScore: number
  missingDataFlags: MissingDataFlag[]
  assembledAt: string
}

// --- Fact Engine ---

export type FactKind = 'FACT' | 'ASSUMPTION' | 'INFERENCE'

export type BrainFact = {
  id: string
  kind: FactKind
  statement: string
  sourceId: BrainKnowledgeSourceId
  reference: string
  entityId?: string
  entityNo?: string
  verified: boolean
  timestamp: string
}

// --- Confidence (0-100) ---

export type ConfidenceFactor =
  | 'DATA_QUALITY'
  | 'MISSING_DATA'
  | 'RULE_COVERAGE'
  | 'HISTORICAL_SIMILARITY'
  | 'PLANNING_CONSISTENCY'
  | 'BOM_CONSISTENCY'
  | 'TIMELINE_CONSISTENCY'

export type ConfidenceFactorScore = {
  factor: ConfidenceFactor
  weight: number
  score: number
  contribution: number
  note: string
}

export type ConfidenceBreakdown = {
  score: number
  factors: ConfidenceFactorScore[]
  incomplete: boolean
  missingDataReasons: string[]
  calculatedAt: string
}

// --- Explainable AI ---

export type ExplanationComponent = {
  label: string
  points: number
  sourceId: BrainKnowledgeSourceId
  fact: string
}

export type ExplanationBreakdown = {
  title: string
  totalScore: number
  components: ExplanationComponent[]
  formula: string
}

// --- Alternative Engine ---

export type ImpactDimension = 'COST' | 'TERMIN' | 'QUALITY' | 'CAPACITY' | 'RISK'

export type ImpactDirection = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export type ImpactMagnitude = 'LOW' | 'MEDIUM' | 'HIGH'

export type ImpactAssessment = {
  dimension: ImpactDimension
  direction: ImpactDirection
  magnitude: ImpactMagnitude
  description: string
}

export type TradeOffAnalysis = {
  alternativeId: string
  advantages: string[]
  disadvantages: string[]
  risks: string[]
  expectedOutcome: string
  impacts: ImpactAssessment[]
}

export type BrainAlternative = {
  id: string
  rank: number
  title: string
  description: string
  advantages: string[]
  disadvantages: string[]
  risks: string[]
  expectedOutcome: string
  impacts: ImpactAssessment[]
  confidenceScore: number
  tradeOff: TradeOffAnalysis
}

// --- Reasoning Tree ---

export type ReasoningStep = {
  id: string
  order: number
  rule: string
  input: string
  output: string
  sourceIds: BrainKnowledgeSourceId[]
}

export type IncompleteAnalysis = {
  completed: false
  message: string
  reasons: string[]
  missingData: MissingDataFlag[]
  confidenceScore: number
}

export type ReasoningTree = {
  treeId: string
  question: string
  focusArea: BrainFocusArea
  facts: BrainFact[]
  evidence: BrainEvidence[]
  reasoningSteps: ReasoningStep[]
  alternatives: BrainAlternative[]
  explanation: ExplanationBreakdown
  confidence: ConfidenceBreakdown
  incomplete?: IncompleteAnalysis
  brainVersion: string
  personaId: BrainPersonaId
  generatedAt: string
}

// --- Brain Personas ---

export type BrainPersonaId =
  | 'PLANNING_ADVISOR'
  | 'PURCHASING_ADVISOR'
  | 'WAREHOUSE_ADVISOR'
  | 'PRODUCTION_ADVISOR'
  | 'QUALITY_ADVISOR'
  | 'COST_ADVISOR'
  | 'EXECUTIVE_ADVISOR'
  | 'MERCHANDISING_ADVISOR'

export type BrainPersona = {
  id: BrainPersonaId
  name: string
  domain: BrainFocusArea | 'GENERAL'
  allowedSources: BrainKnowledgeSourceId[]
  description: string
}

// --- Goal Engine ---

export type GoalDirection = 'BELOW' | 'ABOVE' | 'EQUAL'

export type BrainGoal = {
  id: string
  companyId: string
  metric: string
  label: string
  targetValue: number
  unit: string
  direction: GoalDirection
  active: boolean
}

export type GoalTrackingSnapshot = {
  goalId: string
  currentValue: number
  targetValue: number
  deviation: number
  onTrack: boolean
  trackedAt: string
  suggestedActions: string[]
}

// --- Brain Health ---

export type BrainHealthFlagCode =
  | 'MISSING_BOM'
  | 'MISSING_MRP'
  | 'MISSING_PURCHASE'
  | 'MISSING_EXF'
  | 'MISSING_QUALITY'
  | 'MISSING_TIMELINE'
  | 'MISSING_APPROVAL'
  | 'LOW_DATA_QUALITY'
  | 'LOW_ANALYSIS_CONFIDENCE'
  | 'INCOMPLETE_GRAPH'

export type BrainHealthFlag = {
  code: BrainHealthFlagCode
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  sourceId?: BrainKnowledgeSourceId
}

export type BrainHealthReport = {
  healthScore: number
  dataQualityScore: number
  analysisConfidenceScore: number
  flags: BrainHealthFlag[]
  generatedAt: string
}

// --- Brain Version ---

export type BrainAlgorithmVersion = {
  major: number
  minor: number
  patch: number
  label: string
  chapter: string
  releasedAt: string
}

export type VersionedAnalysisMetadata = {
  brainVersion: string
  algorithmVersion: BrainAlgorithmVersion
  personaId: BrainPersonaId
  pluginIds: string[]
}

// --- Plugin Architecture ---

export type BrainPluginId =
  | 'FORECAST'
  | 'CARBON'
  | 'ESG'
  | 'VISION'
  | 'OCR'
  | 'IOT'

export type BrainPluginStatus = 'REGISTERED' | 'ENABLED' | 'DISABLED'

export type BrainPluginContext = {
  companyId: string
  graph: KnowledgeGraph
  facts: BrainFact[]
}

export type BrainPluginResult = {
  pluginId: BrainPluginId
  insights: string[]
  metrics: Record<string, number>
  confidence: number
}

export type BrainPlugin = {
  id: BrainPluginId
  name: string
  version: string
  status: BrainPluginStatus
  description: string
  /** Çekirdek Brain bu plugin olmadan da çalışır */
  optional: true
  analyze?: (ctx: BrainPluginContext) => BrainPluginResult | null
}

// --- Enhanced Reasoning Output ---

export type BrainReasoningOutput = {
  analysisId: string
  graph: KnowledgeGraph
  facts: BrainFact[]
  reasoningTree: ReasoningTree
  health: BrainHealthReport
  version: VersionedAnalysisMetadata
  generatedAt: string
}

// Extend knowledge source for AI Memory
export type ExtendedBrainKnowledgeSourceId = BrainKnowledgeSourceId | 'AI_MEMORY'
