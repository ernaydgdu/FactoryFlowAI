/**
 * Cost Closing — financial completion of the manufacturing lifecycle (SAP CO-style).
 * Consumes Product Card, BOM, Production, Inventory, Shipment, Commercial Docs, Finance.
 */

export type CostClosingStatus =
  | 'Open'
  | 'Calculating'
  | 'Reconciling'
  | 'Approved'
  | 'Closed'
  | 'Reversed'

export type CostClosingGateCode =
  | 'PRODUCTION_COMPLETED'
  | 'FINISHED_GOODS_RECEIVED'
  | 'SHIPMENT_COMPLETED'
  | 'COMMERCIAL_DOCS_ISSUED'
  | 'ACCOUNTING_POSTINGS_COMPLETED'
  | 'INVENTORY_RECONCILIATION'
  | 'NO_OPEN_PRODUCTION_ORDERS'
  | 'NO_OPEN_PURCHASE_RECEIPTS'

export type CostClosingGate = {
  code: CostClosingGateCode
  passed: boolean
  detail: string
  applicable: boolean
}

export type CostVarianceLine = {
  code: string
  label: string
  planned: number
  actual: number
  variance: number
}

export type CostVarianceBundle = {
  material: CostVarianceLine
  labor: CostVarianceLine
  overhead: CostVarianceLine
  production: CostVarianceLine
  totalVariance: number
}

export type InventoryRevaluation = {
  stockCardId: string | null
  quantity: number
  unitCostBefore: number
  unitCostAfter: number
  revaluationAmount: number
  passed: boolean
  detail: string
}

export type FinancialReconciliation = {
  debitTotal: number
  creditTotal: number
  balanced: boolean
  openPostings: number
  detail: string
}

export type ClosingResult = {
  closedAt: string
  closedBy: string
  totalVariance: number
  revaluationAmount: number
  immutable: true
}

export type CostClosingTimelineEntry = {
  id: string
  occurredAt: string
  actorUserId: string
  action: string
  note: string | null
  status: CostClosingStatus
}

/** Aggregate root */
export type CostClosing = {
  id: string
  batchNo: string
  salesOrderId: string
  salesOrderNo: string
  productCardId: string
  productCode: string
  financialPeriodCode: string
  status: CostClosingStatus
  gates: CostClosingGate[]
  variances: CostVarianceBundle | null
  inventoryRevaluation: InventoryRevaluation | null
  financialReconciliation: FinancialReconciliation | null
  closingResult: ClosingResult | null
  approvalWorkflowId: string | null
  approvalStatus: 'None' | 'Pending' | 'Approved' | 'Rejected'
  anomalyScore: number
  profitabilityHint: string | null
  timeline: CostClosingTimelineEntry[]
  reverseOfId: string | null
  idempotencyKey: string
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreateCostClosingInput = {
  salesOrderId: string
  financialPeriodCode?: string
  idempotencyKey: string
}

export type CostClosingTransitionInput = {
  costClosingId: string
  idempotencyKey: string
  note?: string
}

export type ApproveCostClosingInput = {
  costClosingId: string
  comment?: string
  idempotencyKey: string
}

export type CostClosingBrainReadModel = {
  open: number
  calculating: number
  reconciling: number
  approved: number
  closed: number
  avgAnomalyScore: number
  varianceInsights: Array<{
    id: string
    batchNo: string
    totalVariance: number
    profitabilityHint: string | null
    anomalyScore: number
    status: CostClosingStatus
  }>
  closingAnomalyEvents: Array<{
    id: string
    batchNo: string
    score: number
    detail: string
  }>
}
