import type {
  BrainFocusArea,
  BrainForbiddenOperation,
  BrainKnowledgeSourceId,
  BrainOperationMode,
  BrainRecommendationType,
} from './types'

export const BRAIN_VERSION = '3.0.0-domain'

export const BRAIN_ALGORITHM_VERSION = {
  major: 3,
  minor: 0,
  patch: 0,
  label: '3.0.0-chapter3',
  chapter: 'Digital Factory Twin & Decision Intelligence',
  releasedAt: '2026-08-02T00:00:00Z',
} as const

export const MIN_ALTERNATIVES_PER_ANALYSIS = 3

export const BRAIN_FINAL_DECISION_OWNER = 'USER' as const

export const ALLOWED_KNOWLEDGE_SOURCES: readonly BrainKnowledgeSourceId[] = [
  'BUSINESS_RULE_ENGINE',
  'PLANNING_ENGINE',
  'MASTER_DATA',
  'STOCK_LEDGER',
  'TIMELINE',
  'APPROVAL',
  'AUDIT',
  'VERSIONING',
  'KPI_ENGINE',
  'WORKFLOW',
  'LOCALIZATION',
  'EVENT_BUS',
  'CONFIGURATION',
  'AI_MEMORY',
  'ENTERPRISE_RELATIONS',
  'PRODUCTION_PLANNING',
  'PRODUCTION_ORDER_LIFECYCLE',
] as const

export const FORBIDDEN_OPERATIONS: readonly BrainForbiddenOperation[] = [
  'WRITE',
  'EXECUTE_RULE',
  'EXECUTE_PLANNING',
  'LEDGER_MUTATION',
  'DATABASE_MUTATION',
  'EXTERNAL_FETCH',
  'CROSS_TENANT',
  'CROSS_COMPANY_LEARN',
] as const

export const DEFAULT_ALLOWED_OPERATIONS: BrainOperationMode[] = [
  'READ',
  'ANALYZE',
  'RECOMMEND',
  'SIMULATE',
]

export const BRAIN_DISCLAIMERS = {
  NO_AUTO_DECISION:
    'Kepler Brain karar vermez; yalnızca öneri sunar. Son karar kullanıcıya aittir.',
  NO_LEDGER_WRITE:
    'Kepler Brain Stock Ledger üzerinde işlem yapmaz; yalnızca okur ve analiz eder.',
  NO_RULE_OVERRIDE:
    'Kepler Brain Business Rule Engine veya Planning Engine yerine geçmez.',
  NO_EXTERNAL_DATA:
    'Kepler Brain internetten veya şirket dışından veri almaz/göndermez.',
  OFFLINE_CAPABLE:
    'Kepler Brain offline-first çalışır; ERP erişilebilir olduğu sürece Brain aktiftir.',
  SIMULATION_ONLY:
    'Simülasyon sonuçları projeksiyondur; gerçek ERP kayıtlarını değiştirmez.',
} as const

export const INSIGHT_CODES = {
  TERMIN_RISK: 'INSIGHT_TERMIN_RISK',
  CAPACITY_OVERLOAD: 'INSIGHT_CAPACITY_OVERLOAD',
  CRITICAL_STOCK: 'INSIGHT_CRITICAL_STOCK',
  APPROVAL_BLOCKER: 'INSIGHT_APPROVAL_BLOCKER',
  PRODUCTION_DELAY: 'INSIGHT_PRODUCTION_DELAY',
  MRP_SHORTAGE: 'INSIGHT_MRP_SHORTAGE',
  KPI_DEGRADATION: 'INSIGHT_KPI_DEGRADATION',
} as const

export const RECOMMENDATION_TYPE_BY_FOCUS: Record<BrainFocusArea, BrainRecommendationType[]> = {
  ORDER_RISK: ['TERMIN_RISK_MITIGATION', 'PRODUCTION_SEQUENCE'],
  CAPACITY: ['CAPACITY_REALLOCATION', 'PRODUCTION_SEQUENCE'],
  STOCK: ['STOCK_REPLENISHMENT', 'PURCHASING_PRIORITY'],
  TERMIN: ['TERMIN_RISK_MITIGATION', 'SHIPMENT_RESCHEDULE'],
  PURCHASING: ['PURCHASING_PRIORITY', 'STOCK_REPLENISHMENT'],
  PRODUCTION: ['PRODUCTION_SEQUENCE', 'CAPACITY_REALLOCATION'],
  QUALITY: ['QUALITY_ESCALATION'],
  SHIPMENT: ['SHIPMENT_RESCHEDULE', 'TERMIN_RISK_MITIGATION'],
  GENERAL: ['TERMIN_RISK_MITIGATION', 'CAPACITY_REALLOCATION', 'STOCK_REPLENISHMENT'],
}

export const CONFIDENCE_WEIGHTS = {
  MULTI_SOURCE: 0.15,
  CRITICAL_SEVERITY: 0.1,
  KPI_ALIGNMENT: 0.1,
  TIMELINE_EVIDENCE: 0.05,
  BASE: 0.6,
} as const

export const KEPLER_BRAIN_COMPANY_ID = 'company-kepler-001'
