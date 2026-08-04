/**
 * Kepler Brain — Manufacturing Memory Engine schemas.
 * Immutable enterprise memory. No LLM. No learning. No predictions.
 */

export const MANUFACTURING_MEMORY_SCHEMA_VERSION = 2 as const

export const MFG_MEMORY_COMPANY_ID = 'KEPLER-MFG-MEMORY' as const
export const MFG_MEMORY_DECISION_PREFIX = 'MFG_MEMORY' as const

export type MemoryModule =
  | 'sales-order'
  | 'production-order'
  | 'mrp'
  | 'purchasing'
  | 'inventory'
  | 'warehouse'
  | 'shop-floor'
  | 'quality'
  | 'packaging'
  | 'shipment'
  | 'commercial-documents'
  | 'export-logistics'
  | 'finance-integration'
  | 'cost-closing'
  | 'style-closing'
  | 'reasoning-engine'
  | 'planning-engine'
  | 'simulation-engine'

export type MemoryIndexKey =
  | 'DecisionIndex'
  | 'SupplierIndex'
  | 'MaterialIndex'
  | 'MachineIndex'
  | 'OperatorIndex'
  | 'CustomerIndex'
  | 'StyleIndex'
  | 'ProductionIndex'
  | 'InventoryIndex'
  | 'ShipmentIndex'
  | 'QualityIndex'
  | 'PlanningIndex'
  | 'SimulationIndex'
  | 'RiskIndex'
  | 'ConstraintIndex'
  | 'KpiIndex'

export type MemoryOutcome = 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'OBSERVED'

export type MemoryAccuracy = {
  expected: string | number | boolean | null
  actual: string | number | boolean | null
  delta: number | null
  status: 'MATCH' | 'DEVIATION' | 'NOT_YET_MEASURABLE'
}

export type MemoryAction = {
  recommended: string
  executed: string | null
  actor: string | null
  status: 'EXECUTED' | 'NOT_EXECUTED' | 'UNKNOWN'
}

export type MemoryLinkType =
  | 'PRECEDES'
  | 'FOLLOWS'
  | 'DERIVED_FROM'
  | 'CORRECTS'
  | 'RELATES_TO'

export type MemoryLink = {
  recordId: string
  type: MemoryLinkType
}

/** Immutable manufacturing memory record. */
export type MemoryRecord = {
  id: string
  schemaVersion: typeof MANUFACTURING_MEMORY_SCHEMA_VERSION
  timestamp: string
  module: MemoryModule
  aggregate: string
  event: string
  /** What happened, expressed as stored facts only. */
  observation: string
  decision: string
  /** What the user/system actually executed, if known. */
  action: MemoryAction
  context: string
  /** Factory state known at the time of the record. */
  contextSnapshot: Record<string, string | number | boolean | null>
  constraints: string[]
  rulesFired: string[]
  inputs: Record<string, string | number | boolean | null>
  outputs: Record<string, string | number | boolean | null>
  kpis: Record<string, number>
  confidence: number
  finalOutcome: string
  outcome: {
    actual: string
    status: MemoryOutcome
  }
  accuracy: MemoryAccuracy
  /** Deterministic lessons derived from expected/actual facts. */
  lessons: string[]
  success: MemoryOutcome
  durationMs: number
  references: {
    orderId?: string
    orderNo?: string
    productionOrderNo?: string
    styleCode?: string
    customer?: string
    supplier?: string
    machineCode?: string
    operatorId?: string
    materialCode?: string
    shipmentNo?: string
  }
  /** Stable chain key spanning order → plan → simulation → execution → close. */
  traceId: string
  links: MemoryLink[]
  /** Corrections append a new record and point here; originals are never changed. */
  correctionOf?: string
  indexKeys: MemoryIndexKey[]
}

export type MemoryTimelineReplay = {
  productionOrderNo: string
  traceIds: string[]
  records: MemoryRecord[]
  reconstructed: {
    knownFacts: string[]
    constraints: string[]
    rulesFired: string[]
    recommendations: string[]
    executedActions: string[]
    subsequentOutcomes: string[]
  }
}

export type MemoryIndexBucket = {
  index: MemoryIndexKey
  key: string
  label: string
  recordIds: string[]
  count: number
  lastTimestamp: string
}

export type MemoryQueryPreset =
  | 'decisions-by-style'
  | 'supplier-delays'
  | 'planning-accuracy-by-machine'
  | 'recurring-bottlenecks'
  | 'historical-otif'
  | 'recurring-quality-failures'
  | 'recurring-purchasing-shortages'
  | 'recurring-inventory-shortages'

export type MemoryQueryResult = {
  preset: MemoryQueryPreset
  title: string
  description: string
  records: MemoryRecord[]
  summary: Record<string, string | number>
}

export type MemoryCoverage = {
  schemaVersion: typeof MANUFACTURING_MEMORY_SCHEMA_VERSION
  llmEnabled: false
  sideEffects: 'APPEND_ONLY_BRAIN_MEMORY'
  erpMutations: false
  pipeline: readonly [
    'Knowledge',
    'Reasoning',
    'Planning',
    'Simulation',
    'Memory',
  ]
  implementedLayers: readonly [
    'Knowledge',
    'Reasoning',
    'Planning',
    'Simulation',
    'Memory',
  ]
  totals: {
    records: number
    modules: number
    indexBuckets: number
    queryPresets: number
  }
  byModule: Array<{ module: MemoryModule; count: number }>
  byIndex: Array<{ index: MemoryIndexKey; count: number }>
}
