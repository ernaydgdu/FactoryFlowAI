/** Planning Engine — termin, kapasite, MRP, risk, maliyet ve AI hazırlık katmanı */

import type { OrderCostBreakdown } from './workflows'

export type ProductionStage =
  | 'EXF'
  | 'FABRIC'
  | 'ACCESSORY'
  | 'CUTTING'
  | 'SEWING'
  | 'WASHING'
  | 'PACKING'
  | 'SHIPPING'

export type MilestoneStatus = 'OK' | 'At Risk' | 'Late' | 'Completed'

export type TerminMilestone = {
  stage: ProductionStage
  label: string
  plannedDate: string
  daysFromToday: number
  status: MilestoneStatus
  leadTimeDays: number
}

export type TerminRiskLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export type TerminPlan = {
  orderId: string
  orderNo: string
  exfDate: string
  today: string
  milestones: TerminMilestone[]
  totalSlackDays: number
  bottleneckStage: ProductionStage | null
  riskLevel: TerminRiskLevel
}

export type WorkshopDefinition = {
  code: string
  name: string
  monthlyCapacity: number
  currentLoad: number
}

export type WorkshopCapacitySnapshot = {
  code: string
  name: string
  monthlyCapacity: number
  allocated: number
  remaining: number
  utilizationPercent: number
}

export type CapacityAllocationLine = {
  workshopCode: string
  workshopName: string
  quantity: number
}

export type CapacityAllocation = {
  orderId?: string
  orderNo?: string
  requestedQty: number
  allocations: CapacityAllocationLine[]
  fullyAllocated: boolean
  unallocatedQty: number
  /** Multi-workshop split planı */
  isSplit?: boolean
  splitCount?: number
}

export type ConsolidatedMrpLine = {
  stockCardId: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  totalRequired: number
  onHand: number
  netToPurchase: number
  orderBreakdown: { orderId: string; orderNo: string; quantity: number }[]
  suggestedSupplier: string
  leadTimeDays: number
}

export type PurchaseSuggestion = {
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  supplier: string
  consolidatedFromOrders: number
}

export type ConsolidatedMrp = {
  generatedAt: string
  openOrderCount: number
  lines: ConsolidatedMrpLine[]
  purchaseSuggestions: PurchaseSuggestion[]
}

export type RiskFactorCode =
  | 'FABRIC_DELAY'
  | 'ACCESSORY_DELAY'
  | 'CAPACITY_FULL'
  | 'WASHING_DELAY'
  | 'QUALITY_REJECT'
  | 'EXF_AT_RISK'

export type RiskFactor = {
  code: RiskFactorCode
  label: string
  weight: number
  triggered: boolean
  contribution: number
  detail: string
}

export type OrderRiskLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export type OrderRiskAssessment = {
  orderId: string
  orderNo: string
  score: number
  level: OrderRiskLevel
  factors: RiskFactor[]
  exfAtRisk: boolean
  summary: string
}

export type PlanningSnapshot = {
  orderId: string
  orderNo: string
  quantity: number
  exfDate: string
  termin: TerminPlan
  risk: OrderRiskAssessment
  cost: OrderCostBreakdown
  capacity?: CapacityAllocation
  splitCapacity?: CapacityAllocation
}

export type SupplierSimulationResult = {
  orderId: string
  orderNo: string
  originalLeadTimeDays: number
  newLeadTimeDays: number
  originalRiskScore: number
  newRiskScore: number
  originalExfFeasible: boolean
  newExfFeasible: boolean
  impactSummary: string
}

export type PlanningEngineOutput = {
  generatedAt: string
  referenceDate: string
  terminPlans: TerminPlan[]
  workshopCapacities: WorkshopCapacitySnapshot[]
  consolidatedMrp: ConsolidatedMrp
  riskAssessments: OrderRiskAssessment[]
  snapshots: PlanningSnapshot[]
}

export type RiskExplanation = {
  orderId: string
  orderNo: string
  score: number
  level: OrderRiskLevel
  narrative: string
  triggeredFactors: RiskFactor[]
  recommendations: string[]
}

/** Termin geri planlama — aşama bazlı varsayılan süreler (iş günü) */
export type TerminLeadTimes = {
  shippingBuffer: number
  packing: number
  washing: number
  sewingPer1000Units: number
  cutting: number
  accessoryBuffer: number
  fabricBuffer: number
}

export const DEFAULT_TERMIN_LEAD_TIMES: TerminLeadTimes = {
  shippingBuffer: 1,
  packing: 3,
  washing: 5,
  sewingPer1000Units: 4,
  cutting: 2,
  accessoryBuffer: 3,
  fabricBuffer: 5,
}


/** Risk faktör ağırlıkları (toplam max 100) */
export const RISK_FACTOR_WEIGHTS: Record<RiskFactorCode, number> = {
  FABRIC_DELAY: 25,
  ACCESSORY_DELAY: 20,
  CAPACITY_FULL: 15,
  WASHING_DELAY: 10,
  QUALITY_REJECT: 20,
  EXF_AT_RISK: 30,
}
