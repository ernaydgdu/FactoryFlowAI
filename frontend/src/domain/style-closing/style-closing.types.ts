/**
 * Style Closing — final business completion of a textile style (Product Card).
 * Fashion ERP maturity: Infor Fashion / BlueCherry / SAP Fashion / D365 Apparel.
 */

export type StyleClosingStatus = 'Open' | 'Checking' | 'Ready' | 'Approved' | 'Closed'

export type StyleChecklistCode =
  | 'ALL_SALES_ORDERS_COMPLETED'
  | 'ALL_PRODUCTION_ORDERS_CLOSED'
  | 'ALL_PURCHASE_ORDERS_CLOSED'
  | 'MRP_COMPLETED'
  | 'INVENTORY_RECONCILED'
  | 'WAREHOUSE_RECONCILED'
  | 'QUALITY_APPROVED'
  | 'SHIPMENTS_COMPLETED'
  | 'COMMERCIAL_DOCS_ISSUED'
  | 'ACCOUNTING_POSTINGS_COMPLETE'
  | 'COST_CLOSING_APPROVED'
  | 'NO_OPEN_NCR'
  | 'NO_PENDING_RESERVATIONS'
  | 'NO_OPEN_WORK_ORDERS'

export type CompletionChecklistItem = {
  code: StyleChecklistCode
  label: string
  passed: boolean
  applicable: boolean
  detail: string
}

export type MissingRequirement = {
  code: StyleChecklistCode
  detail: string
}

export type StyleKpiSnapshot = {
  salesOrderCount: number
  productionOrderCount: number
  producedQty: number
  shippedQty: number
  openNcrCount: number
  totalPlannedCost: number
  totalVariance: number
  revenueEstimate: number
  finalMargin: number
  marginPercent: number
  capturedAt: string
}

export type FinalMargin = {
  revenue: number
  cost: number
  margin: number
  marginPercent: number
}

export type FinalConsumption = {
  materialPlanned: number
  materialActual: number
  variance: number
}

export type FinalCost = {
  planned: number
  actual: number
  variance: number
}

export type FinalShipmentSummary = {
  shipmentCount: number
  totalQty: number
  allCompleted: boolean
}

export type FinalQualitySummary = {
  openNcr: number
  holdCount: number
  approved: boolean
}

export type StyleClosingTimelineEntry = {
  id: string
  occurredAt: string
  actorUserId: string
  action: string
  note: string | null
  status: StyleClosingStatus
}

/** Aggregate root */
export type StyleClosing = {
  id: string
  batchNo: string
  productCardId: string
  productCode: string
  productName: string
  status: StyleClosingStatus
  checklist: CompletionChecklistItem[]
  missingRequirements: MissingRequirement[]
  kpiSnapshot: StyleKpiSnapshot | null
  finalMargin: FinalMargin | null
  finalConsumption: FinalConsumption | null
  finalCost: FinalCost | null
  finalShipmentSummary: FinalShipmentSummary | null
  finalQualitySummary: FinalQualitySummary | null
  approvalWorkflowId: string | null
  approvalStatus: 'None' | 'Pending' | 'Approved' | 'Rejected'
  anomalyScore: number
  profitabilityHint: string | null
  timeline: StyleClosingTimelineEntry[]
  closedAt: string | null
  closedBy: string | null
  idempotencyKey: string
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreateStyleClosingInput = {
  productCardId: string
  idempotencyKey: string
}

export type StyleClosingTransitionInput = {
  styleClosingId: string
  idempotencyKey: string
  note?: string
}

export type ApproveStyleClosingInput = {
  styleClosingId: string
  comment?: string
  idempotencyKey: string
}

export type StyleClosingBrainReadModel = {
  open: number
  checking: number
  ready: number
  approved: number
  closed: number
  avgAnomalyScore: number
  avgMarginPercent: number
  styleSummaries: Array<{
    id: string
    batchNo: string
    productCode: string
    status: StyleClosingStatus
    finalMargin: number | null
    marginPercent: number | null
    missingCount: number
    anomalyScore: number
    profitabilityHint: string | null
  }>
  anomalyEvents: Array<{
    id: string
    batchNo: string
    productCode: string
    score: number
    detail: string
  }>
}
