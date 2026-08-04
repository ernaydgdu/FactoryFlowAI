/**
 * Phase 8 — AI Foundation surfaces (no LLM).
 * Unified Brain read models, twin completeness, event catalog, recommendation/prediction interfaces.
 */
import { queryFinanceIntegrationBrainReadModel } from '@/domain/finance-integration/finance-integration-query.service'
import { queryCostClosingBrainReadModel } from '@/domain/cost-closing/cost-closing-query.service'
import { queryStyleClosingBrainReadModel } from '@/domain/style-closing/style-closing-query.service'
import { queryExportLogisticsBrainReadModel } from '@/domain/export-logistics/export-logistics-query.service'
import { buildFactoryGraph } from '@/domain/brain/twin/engines/factory-graph-engine'
import { assessDigitalTwinHealth } from '@/domain/brain/twin/engines/digital-twin-health-engine'
import type { FactoryGraphNodeType } from '@/domain/brain/twin/types'
import type { BrainContext, BrainKnowledgeSnapshot } from '@/domain/brain/types'
import type { DomainEventType } from '@/domain/platform/types'

export type BrainDomainReadModelRef = {
  domain: string
  surface: string
  available: boolean
}

export type DomainEventCatalogEntry = {
  aggregate: string
  eventType: string
  explainability: string
}

export type AiRecommendationSurface = {
  id: string
  domain: string
  title: string
  rationale: string
  confidence: number
  sideEffects: 'NONE'
}

export type AiPredictionSurface = {
  id: string
  domain: string
  metric: string
  value: number
  unit: string
  explainability: string
}

export type EnterpriseAiFoundationModel = {
  brainReadModels: BrainDomainReadModelRef[]
  twinNodeTypesPresent: FactoryGraphNodeType[]
  twinCompletenessScore: number
  twinCriticalFlags: string[]
  domainEventCatalog: DomainEventCatalogEntry[]
  recommendations: AiRecommendationSurface[]
  predictions: AiPredictionSurface[]
  explainability: {
    deterministicOnly: true
    llmEnabled: false
    auditHint: string
  }
}

/** Catalog ⊆ DomainEventType — must match platform/types + outbox-event-mapping (TD-P0-08). */
const EVENT_CATALOG: DomainEventCatalogEntry[] = (
  [
    { aggregate: 'SalesOrder', eventType: 'OrderCreated', explainability: 'Sales order create → outbox brain/notification/ai-memory/dashboard' },
    { aggregate: 'ProductCard', eventType: 'BomApproved', explainability: 'BOM approval → brain/digital-twin/ai-memory' },
    { aggregate: 'PurchaseOrder', eventType: 'PurchaseCreated', explainability: 'Purchasing create event (default ai-memory handlers)' },
    { aggregate: 'StockLedger', eventType: 'StockReceived', explainability: 'Inventory receipt event (default ai-memory handlers)' },
    { aggregate: 'ProductionOrder', eventType: 'ProductionStarted', explainability: 'Production start → brain/dashboard/wip-refresh/digital-twin' },
    { aggregate: 'ProductionOrder', eventType: 'ProductionFinished', explainability: 'Production finish → brain/dashboard/digital-twin' },
    { aggregate: 'Shipment', eventType: 'ShipmentCompleted', explainability: 'Shipment complete → brain/notification/dashboard' },
    { aggregate: 'EntityRevision', eventType: 'RevisionActivated', explainability: 'Revision activate → brain/digital-twin/ai-memory' },
    { aggregate: 'ApprovalWorkflow', eventType: 'ApprovalSubmitted', explainability: 'Approval submit (default ai-memory handlers)' },
    { aggregate: 'ApprovalWorkflow', eventType: 'ApprovalCompleted', explainability: 'Approval complete → brain/notification/ai-memory' },
    { aggregate: 'Comment', eventType: 'CommentAdded', explainability: 'Comment stream (default ai-memory handlers)' },
    { aggregate: 'EntityTag', eventType: 'TagApplied', explainability: 'Tag stream (default ai-memory handlers)' },
    { aggregate: 'Platform', eventType: 'EntityUpdated', explainability: 'Generic entity update → brain/dashboard/ai-memory' },
  ] as const satisfies ReadonlyArray<{
    aggregate: string
    eventType: DomainEventType
    explainability: string
  }>
).map((e) => ({ ...e }))

function foundationContext(): BrainContext {
  return {
    companyId: 'kepler',
    userId: 'system',
    tenantId: 'default',
    sessionId: 'enterprise-ai-foundation',
    requestedAt: new Date().toISOString(),
    operationMode: 'ANALYZE',
    scope: {},
  }
}

function emptySnapshot(context: BrainContext): BrainKnowledgeSnapshot {
  return {
    snapshotId: 'enterprise-ai-foundation',
    context,
    fragments: [],
    assembledAt: new Date().toISOString(),
    sourceCount: 0,
    completenessScore: 0,
  }
}

export function queryEnterpriseAiFoundation(): EnterpriseAiFoundationModel {
  const finance = queryFinanceIntegrationBrainReadModel()
  const cost = queryCostClosingBrainReadModel()
  const style = queryStyleClosingBrainReadModel()
  const exportBrain = queryExportLogisticsBrainReadModel()

  const context = foundationContext()
  const graph = buildFactoryGraph(context, emptySnapshot(context))
  const health = assessDigitalTwinHealth(graph)
  const twinNodeTypesPresent = Array.from(
    new Set(graph.nodes.map((n) => n.type)),
  ) as FactoryGraphNodeType[]

  const recommendations: AiRecommendationSurface[] = [
    ...finance.costAnomalyEvents.slice(0, 5).map((e) => ({
      id: `rec-fin-${e.batchId}`,
      domain: 'finance',
      title: `Review posting anomaly ${e.batchNo}`,
      rationale: `Cost anomaly score ${e.score} on ${e.sourceEventType}`,
      confidence: Math.min(0.95, e.score / 100),
      sideEffects: 'NONE' as const,
    })),
    ...style.anomalyEvents.slice(0, 5).map((e) => ({
      id: `rec-style-${e.id}`,
      domain: 'style-closing',
      title: `Style close risk ${e.productCode}`,
      rationale: e.detail,
      confidence: Math.min(0.95, e.score / 100),
      sideEffects: 'NONE' as const,
    })),
  ]

  const predictions: AiPredictionSurface[] = [
    {
      id: 'pred-export-delay',
      domain: 'export-logistics',
      metric: 'avgDelayRiskScore',
      value: exportBrain.avgDelayRiskScore,
      unit: 'score',
      explainability: 'Deterministic delay heuristic from export gates',
    },
    {
      id: 'pred-cost-anomaly',
      domain: 'cost-closing',
      metric: 'avgAnomalyScore',
      value: cost.avgAnomalyScore,
      unit: 'score',
      explainability: 'Variance + gate failure weighted score',
    },
    {
      id: 'pred-style-margin',
      domain: 'style-closing',
      metric: 'avgMarginPercent',
      value: style.avgMarginPercent,
      unit: '%',
      explainability: 'Final margin from KPI snapshot aggregation',
    },
  ]

  return {
    brainReadModels: [
      { domain: 'finance-integration', surface: 'queryFinanceIntegrationBrainReadModel', available: true },
      { domain: 'cost-closing', surface: 'queryCostClosingBrainReadModel', available: true },
      { domain: 'style-closing', surface: 'queryStyleClosingBrainReadModel', available: true },
      { domain: 'export-logistics', surface: 'queryExportLogisticsBrainReadModel', available: true },
    ],
    twinNodeTypesPresent,
    twinCompletenessScore: health.dataCompletenessScore,
    twinCriticalFlags: health.flags.filter((f) => f.severity === 'CRITICAL').map((f) => f.code),
    domainEventCatalog: EVENT_CATALOG,
    recommendations,
    predictions,
    explainability: {
      deterministicOnly: true,
      llmEnabled: false,
      auditHint: 'All recommendations/predictions are derived from audited domain read models',
    },
  }
}
