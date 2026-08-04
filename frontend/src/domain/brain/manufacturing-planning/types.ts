/**
 * Kepler Brain — Manufacturing Planning Engine schemas.
 * Executable production plans as recommendations. No LLM. No ERP mutation.
 *
 * Consumes: Knowledge · Facts · Reasoning · Constraints · Decisions
 */

export const MANUFACTURING_PLANNING_SCHEMA_VERSION = 1 as const

export type PlanVariant = 'A' | 'B' | 'C'

export type PlanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ProductionSequenceStep = {
  sequence: number
  productionOrderNo: string
  salesOrderNo: string
  productCode: string
  workshopCode: string
  operationHint: string
  plannedStartDayOffset: number
  plannedDurationDays: number
  priority: number
  remainingQty: number
}

export type CapacityAllocation = {
  workshopCode: string
  workshopName: string
  allocatedOrders: number
  allocatedQty: number
  utilizationBefore: number
  utilizationAfter: number
  freeCapacityBefore: number
}

export type MachineAllocation = {
  machineCode: string
  machineName: string
  operationCode: string
  productionOrderNo: string
  estimatedHours: number
}

export type OperatorAllocation = {
  workshopCode: string
  estimatedOperators: number
  samMinutes: number
  shiftHint: string
}

export type MaterialAllocation = {
  materialCode: string
  materialName: string
  requiredQty: number
  availableQty: number
  shortfall: number
  unit: string
  reservedForOrders: string[]
}

export type PurchasingSuggestion = {
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  supplierHint: string
  reason: string
}

export type ShipmentImpact = {
  salesOrderNo: string
  canShipPartial: boolean
  delayedDays: number
  blockedByQuality: boolean
  note: string
}

export type DeliveryRisk = {
  salesOrderNo: string
  riskLevel: PlanRiskLevel
  score: number
  drivers: string[]
}

export type CriticalPathNode = {
  id: string
  label: string
  durationDays: number
  dependsOn: string[]
  moduleRef: string
}

export type BottleneckAnalysis = {
  id: string
  kind: 'Capacity' | 'Material' | 'Machine' | 'Quality' | 'Shipment' | 'Financial'
  label: string
  severity: PlanRiskLevel
  evidence: string[]
  reliefActions: string[]
}

export type PlanExplanation = {
  why: string
  assumptions: string[]
  constraintsEvaluated: string[]
  kpisImproved: string[]
  risksRemaining: string[]
}

export type ManufacturingPlan = {
  variant: PlanVariant
  name: string
  strategy: string
  confidence: number
  sequencing: ProductionSequenceStep[]
  capacity: CapacityAllocation[]
  machines: MachineAllocation[]
  operators: OperatorAllocation[]
  materials: MaterialAllocation[]
  purchasing: PurchasingSuggestion[]
  shipmentImpact: ShipmentImpact[]
  deliveryRisks: DeliveryRisk[]
  criticalPath: CriticalPathNode[]
  bottlenecks: BottleneckAnalysis[]
  explanation: PlanExplanation
}

export type PlanningCoverage = {
  schemaVersion: typeof MANUFACTURING_PLANNING_SCHEMA_VERSION
  llmEnabled: false
  sideEffects: 'NONE'
  pipeline: readonly [
    'Knowledge',
    'Facts',
    'Reasoning',
    'Constraints',
    'Decisions',
    'Planning',
  ]
  implementedLayers: readonly ['Knowledge', 'Reasoning', 'Planning']
  totals: {
    plans: number
    sequenceSteps: number
    capacityRows: number
    machineRows: number
    operatorRows: number
    materialRows: number
    purchasingSuggestions: number
    shipmentImpacts: number
    deliveryRisks: number
    criticalPathNodes: number
    bottlenecks: number
  }
  preferredVariant: PlanVariant
  consumedFromReasoning: {
    facts: number
    constraints: number
    decisions: number
    recommendations: number
  }
}

export type ManufacturingPlanningRun = {
  schemaVersion: typeof MANUFACTURING_PLANNING_SCHEMA_VERSION
  ranAt: string
  llmEnabled: false
  sideEffects: 'NONE'
  preferredVariant: PlanVariant
  plans: ManufacturingPlan[]
  coverage: PlanningCoverage
}
