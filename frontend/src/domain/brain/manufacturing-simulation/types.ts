/**
 * Kepler Brain — Manufacturing Simulation Engine schemas.
 * Deterministic what-if scenarios. No LLM. No ERP mutation.
 */

export const MANUFACTURING_SIMULATION_SCHEMA_VERSION = 1 as const

export type ScenarioSlot = 'CURRENT' | 'A' | 'B' | 'C'

export type ScenarioShockType =
  | 'MACHINE_DOWNTIME'
  | 'SUPPLIER_DELAY'
  | 'ORDER_URGENT'
  | 'OVERTIME_ENABLED'
  | 'OPERATOR_AVAILABILITY'
  | 'CUTTING_YIELD_DROP'

export type ScenarioShock = {
  type: ScenarioShockType
  /** Human-readable parameter, e.g. machine code or supplier hint */
  target: string
  /** Magnitude — hours, days, percent points, or ratio depending on type */
  magnitude: number
  unit: 'hours' | 'days' | 'percent' | 'ratio' | 'flag'
}

export type ScenarioDefinition = {
  slot: ScenarioSlot
  code: string
  name: string
  question: string
  shocks: ScenarioShock[]
}

export type SimulationMetrics = {
  otifImpactPct: number
  productionCompletionDayOffset: number
  resourceUtilizationPct: number
  queueGrowthUnits: number
  bottleneckLabel: string
  bottleneckMoved: boolean
  wipDelta: number
  inventoryImpactUnits: number
  purchasingImpactQty: number
  shipmentDelayDays: number
  costDelta: number
  confidence: number
}

export type TimelinePoint = {
  dayOffset: number
  label: string
  wip: number
  utilization: number
  completions: number
  queue: number
  inventory: number
}

export type ScenarioResult = {
  slot: ScenarioSlot
  definition: ScenarioDefinition
  metrics: SimulationMetrics
  timeline: TimelinePoint[]
  assumptions: string[]
  drivers: string[]
}

export type MetricComparisonRow = {
  metric: string
  current: number
  a: number
  b: number
  c: number
  unit: string
}

export type SimulationCoverage = {
  schemaVersion: typeof MANUFACTURING_SIMULATION_SCHEMA_VERSION
  llmEnabled: false
  sideEffects: 'NONE'
  pipeline: readonly [
    'Knowledge',
    'Facts',
    'Reasoning',
    'Planning',
    'Simulation',
  ]
  implementedLayers: readonly ['Knowledge', 'Reasoning', 'Planning', 'Simulation']
  totals: {
    scenarios: number
    timelinePoints: number
    comparisonRows: number
  }
  consumed: {
    planningPlans: number
    reasoningConstraints: number
    reasoningFacts: number
  }
}

export type ManufacturingSimulationRun = {
  schemaVersion: typeof MANUFACTURING_SIMULATION_SCHEMA_VERSION
  ranAt: string
  llmEnabled: false
  sideEffects: 'NONE'
  baselineSlot: 'CURRENT'
  scenarios: ScenarioResult[]
  comparison: MetricComparisonRow[]
  coverage: SimulationCoverage
}
