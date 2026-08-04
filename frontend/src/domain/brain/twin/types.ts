/** Kepler Brain Chapter 3 — Digital Factory Twin & Decision Intelligence types */

import type { BrainKnowledgeSourceId } from '../types'

// --- Factory Graph ---

export type FactoryGraphNodeType =
  | 'FACTORY'
  | 'WORKSHOP'
  | 'PRODUCTION_LINE'
  | 'MACHINE'
  | 'OPERATOR'
  | 'WAREHOUSE'
  | 'STOCK_CARD'
  | 'ORDER'
  | 'PRODUCT'
  | 'OPERATION'
  | 'CONTAINER'
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'MATERIAL'
  | 'BOM'
  | 'PURCHASE_ORDER'
  | 'PRODUCTION_ORDER'
  | 'PACKING_LIST'
  | 'EXPORT_DOCUMENT_SET'
  | 'EXPORT_SHIPMENT'
  | 'ACCOUNTING_INTEGRATION'
  | 'COST_CLOSING'
  | 'STYLE_CLOSING'
  | 'SHIPMENT'
  | 'QUALITY_INSPECTION'
  | 'TIMELINE_EVENT'

export type FactoryGraphRelationshipType =
  | 'USES'
  | 'CONSUMES'
  | 'LOCATED_IN'
  | 'SUPPLIES'
  | 'RUNS'
  | 'CONTAINS'
  | 'OPERATES'
  | 'ASSIGNED_TO'
  | 'PRODUCES'
  | 'INSPECTS'
  | 'SHIPS_TO'
  | 'ORDERED_BY'
  | 'PURCHASED_FROM'
  | 'DEPENDS_ON'
  | 'TRIGGERS'
  | 'FOLLOWS'
  | 'SPLIT_FROM'

export type FactoryGraphNode = {
  id: string
  type: FactoryGraphNodeType
  label: string
  entityId: string
  sourceId: BrainKnowledgeSourceId
  attributes: Record<string, unknown>
  dataQuality: 'COMPLETE' | 'PARTIAL' | 'MISSING'
}

export type FactoryGraphEdge = {
  id: string
  fromNodeId: string
  toNodeId: string
  relationship: FactoryGraphRelationshipType
  sourceId: BrainKnowledgeSourceId
  label?: string
}

export type FactoryGraph = {
  graphId: string
  companyId: string
  nodes: FactoryGraphNode[]
  edges: FactoryGraphEdge[]
  nodeCount: number
  edgeCount: number
  assembledAt: string
  /** Digital Twin ERP verisini değiştirmez */
  sideEffects: 'NONE'
}

// --- Resource Graph ---

export type ResourceGraphNodeType =
  | 'ORDER'
  | 'PRODUCT'
  | 'BOM'
  | 'OPERATION'
  | 'MACHINE'
  | 'OPERATOR'
  | 'PRODUCTION_LINE'
  | 'WORKSHOP'
  | 'WAREHOUSE'
  | 'CONTAINER'
  | 'CUSTOMER'

export type ResourceGraph = {
  graphId: string
  rootOrderId?: string
  chain: ResourceGraphNodeType[]
  nodes: FactoryGraphNode[]
  edges: FactoryGraphEdge[]
  assembledAt: string
  sideEffects: 'NONE'
}

// --- Flow Engine ---

export type ProductionFlowStage =
  | 'ORDER_RECEIVED'
  | 'CUTTING'
  | 'SEWING'
  | 'WASHING'
  | 'QUALITY'
  | 'PACKING'
  | 'WAREHOUSE'
  | 'SHIPMENT'

export type OrderFlowState = {
  orderId: string
  orderNo: string
  currentStage: ProductionFlowStage
  completedStages: ProductionFlowStage[]
  pendingStages: ProductionFlowStage[]
  blockedAt?: ProductionFlowStage
  blockerReason?: string
  lastTimelineEventId?: string
  progressPercent: number
}

export type FlowTransition = {
  from: ProductionFlowStage
  to: ProductionFlowStage
  requiresTimelineEvent: boolean
  typicalLeadTimeDays: number
}

// --- Bottleneck Engine ---

export type BottleneckCategory =
  | 'LINE_CAPACITY'
  | 'MACHINE_FAILURE'
  | 'OPERATOR_SHORTAGE'
  | 'FABRIC_DELAY'
  | 'QUALITY_HOLD'
  | 'WASHING_CONGESTION'
  | 'PACKING_QUEUE'
  | 'ACCESSORY_DELAY'

export type Bottleneck = {
  id: string
  category: BottleneckCategory
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  affectedNodeIds: string[]
  affectedOrderIds: string[]
  estimatedDelayDays: number
  sourceId: BrainKnowledgeSourceId
}

// --- Root Cause Engine ---

export type RootCauseNode = {
  id: string
  level: number
  cause: string
  factBased: boolean
  sourceId?: BrainKnowledgeSourceId
  delayDays?: number
  childIds: string[]
}

export type RootCauseTree = {
  treeId: string
  problemStatement: string
  rootOrderId?: string
  rootOrderNo?: string
  nodes: RootCauseNode[]
  rootCauseId: string
  totalDelayDays: number
  generatedAt: string
}

// --- Dependency Engine ---

export type DependencyType = 'SHARED_MATERIAL' | 'SHARED_MACHINE' | 'SHARED_LINE' | 'SHARED_WORKSHOP' | 'SEQUENTIAL_ORDER'

export type DependencyEdge = {
  id: string
  type: DependencyType
  fromOrderId: string
  toOrderId: string
  sharedResourceId: string
  sharedResourceLabel: string
  impactDescription: string
}

export type DependencyGraph = {
  graphId: string
  edges: DependencyEdge[]
  sharedResources: Array<{ resourceId: string; label: string; orderIds: string[] }>
  generatedAt: string
}

// --- Impact Engine ---

export type ImpactScope = 'ORDER' | 'PRODUCTION' | 'WAREHOUSE' | 'COST' | 'TERMIN'

export type TwinScopeImpact = {
  scope: ImpactScope
  entityId: string
  entityLabel: string
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  estimatedCostDelta?: number
  estimatedDelayDays?: number
}

export type TwinImpactAnalysis = {
  analysisId: string
  triggerEvent: string
  triggerResourceId?: string
  affectedOrders: TwinScopeImpact[]
  affectedProductions: TwinScopeImpact[]
  affectedWarehouses: TwinScopeImpact[]
  affectedCosts: TwinScopeImpact[]
  affectedTermins: TwinScopeImpact[]
  summary: string
  generatedAt: string
  sideEffects: 'NONE'
}

// --- Scenario Engine ---

export type TwinScenarioType =
  | 'WORKSHOP_CLOSED'
  | 'CURRENCY_SPIKE'
  | 'COTTON_PRICE_UP'
  | 'BUYER_EXF_CHANGE'
  | 'NEW_ORDER_ARRIVAL'
  | 'MACHINE_BREAKDOWN'
  | 'OPERATOR_LEAVE'
  | 'FABRIC_REJECTED'
  | 'QUALITY_WASTE_SPIKE'

export type TwinScenario = {
  id: string
  type: TwinScenarioType
  name: string
  hypothesis: string
  parameters: Record<string, string | number | boolean>
  createdAt: string
}

export type TwinScenarioOutcome = {
  metric: string
  baseValue: string | number
  projectedValue: string | number
  delta: string | number
}

export type TwinScenarioResult = {
  scenarioId: string
  scenarioName: string
  outcomes: TwinScenarioOutcome[]
  impactedOrderIds: string[]
  risks: string[]
  assumptions: string[]
  disclaimer: string
  sideEffects: 'NONE'
  generatedAt: string
}

// --- Prediction & Early Warning ---

export type PredictionHorizon = '3_DAYS' | '6_DAYS' | '8_DAYS' | '10_DAYS' | '14_DAYS'

export type Prediction = {
  id: string
  horizon: PredictionHorizon
  horizonDays: number
  metric: string
  predictedEvent: string
  confidence: number
  basis: string
  sourceIds: BrainKnowledgeSourceId[]
}

export type EarlyWarning = {
  id: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  message: string
  triggerMetric: string
  thresholdValue: number
  projectedDaysUntil: number
  recommendedActions: string[]
  generatedAt: string
}

// --- Decision Memory (company-scoped only) ---

export type DecisionOutcome = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'PENDING'

export type DecisionMemoryEntry = {
  id: string
  companyId: string
  userId: string
  decisionType: string
  context: string
  actionTaken: string
  outcome: DecisionOutcome
  outcomeNotes: string
  relatedOrderId?: string
  recordedAt: string
  /** Başka şirketlere aktarılamaz */
  tenantScoped: true
}

// --- Playbook Engine ---

export type PlaybookTrigger = 'FABRIC_DELAY' | 'TERMIN_RISK' | 'CAPACITY_OVERLOAD' | 'QUALITY_ISSUE' | 'STOCK_SHORTAGE'

export type PlaybookStep = {
  order: number
  action: string
  description: string
  requiresApproval: boolean
}

export type Playbook = {
  id: string
  companyId: string
  name: string
  trigger: PlaybookTrigger
  steps: PlaybookStep[]
  active: boolean
}

export type PlaybookRecommendation = {
  playbookId: string
  playbookName: string
  trigger: PlaybookTrigger
  rankedSteps: PlaybookStep[]
  matchScore: number
}

// --- Human Feedback ---

export type FeedbackDecision = 'ACCEPTED' | 'REJECTED'

export type FeedbackRejectReason = 'QUALITY' | 'COST' | 'BUYER_REQUEST' | 'CAPACITY' | 'OTHER'

export type HumanFeedbackEntry = {
  id: string
  companyId: string
  userId: string
  recommendationId: string
  decision: FeedbackDecision
  rejectReason?: FeedbackRejectReason
  rejectNotes?: string
  outcome?: DecisionOutcome
  recordedAt: string
  tenantScoped: true
}

// --- Digital Twin Health ---

export type TwinHealthFlagCode =
  | 'MISSING_MACHINE'
  | 'MISSING_OPERATION'
  | 'MISSING_LINE'
  | 'MISSING_BOM'
  | 'MISSING_TIMELINE'
  | 'MISSING_CAPACITY'
  | 'MISSING_WAREHOUSE'
  | 'MISSING_CONSUMPTION'
  | 'INCOMPLETE_GRAPH'

export type TwinHealthFlag = {
  code: TwinHealthFlagCode
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  nodeType?: FactoryGraphNodeType
}

export type DigitalTwinHealthReport = {
  twinHealthScore: number
  dataCompletenessScore: number
  graphConnectivityScore: number
  flags: TwinHealthFlag[]
  generatedAt: string
}

// --- Orchestrator Output ---

export type DigitalTwinIntelligenceOutput = {
  twinId: string
  companyId: string
  factoryGraph: FactoryGraph
  resourceGraph: ResourceGraph
  orderFlow?: OrderFlowState
  bottlenecks: Bottleneck[]
  rootCause?: RootCauseTree
  dependencies: DependencyGraph
  predictions: Prediction[]
  earlyWarnings: EarlyWarning[]
  twinHealth: DigitalTwinHealthReport
  brainVersion: string
  generatedAt: string
  sideEffects: 'NONE'
  finalDecisionOwner: 'USER'
}
