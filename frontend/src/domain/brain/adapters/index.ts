import { aiMemoryAdapter } from './ai-memory-adapter'
import { approvalAdapter } from './approval-adapter'
import { auditAdapter } from './audit-adapter'
import { businessRuleEngineAdapter } from './business-rule-adapter'
import { configurationAdapter } from './configuration-adapter'
import { eventBusAdapter } from './event-bus-adapter'
import { kpiEngineAdapter } from './kpi-adapter'
import { localizationAdapter } from './localization-adapter'
import { masterDataAdapter } from './master-data-adapter'
import { enterpriseRelationAdapter } from './enterprise-relation-adapter'
import { productionPlanningAdapter } from './production-planning-adapter'
import { productionOrderLifecycleAdapter } from './production-order-lifecycle-adapter'
import { planningEngineAdapter } from './planning-engine-adapter'
import { stockLedgerAdapter } from './stock-ledger-adapter'
import { timelineAdapter } from './timeline-adapter'
import { versioningAdapter } from './versioning-adapter'
import { workflowAdapter } from './workflow-adapter'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const BRAIN_KNOWLEDGE_ADAPTERS: BrainKnowledgeSourceAdapter[] = [
  businessRuleEngineAdapter,
  planningEngineAdapter,
  productionPlanningAdapter,
  productionOrderLifecycleAdapter,
  masterDataAdapter,
  enterpriseRelationAdapter,
  stockLedgerAdapter,
  timelineAdapter,
  approvalAdapter,
  auditAdapter,
  versioningAdapter,
  kpiEngineAdapter,
  workflowAdapter,
  localizationAdapter,
  eventBusAdapter,
  aiMemoryAdapter,
  configurationAdapter,
]

export function getAdapterBySourceId(
  sourceId: string,
): BrainKnowledgeSourceAdapter | undefined {
  return BRAIN_KNOWLEDGE_ADAPTERS.find((a) => a.sourceId === sourceId)
}

export {
  businessRuleEngineAdapter,
  planningEngineAdapter,
  productionPlanningAdapter,
  productionOrderLifecycleAdapter,
  masterDataAdapter,
  enterpriseRelationAdapter,
  stockLedgerAdapter,
  timelineAdapter,
  approvalAdapter,
  auditAdapter,
  versioningAdapter,
  kpiEngineAdapter,
  workflowAdapter,
  localizationAdapter,
  eventBusAdapter,
  configurationAdapter,
  aiMemoryAdapter,
}
