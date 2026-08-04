/**
 * Finance Integration — AccountingIntegration aggregate.
 * Transforms operational ERP events into double-entry accounting postings.
 * Not a full GL ERP; integration layer only (SAP FI/CO-style event→journal).
 */

export type AccountingSourceEventType =
  | 'ProductionComplete'
  | 'FinishedGoodsReceipt'
  | 'ShipmentDeparted'
  | 'CommercialInvoiceIssued'
  | 'PurchaseReceipt'
  | 'PurchaseInvoice'
  | 'InventoryAdjustment'
  | 'CostClosing'

export type PostingBatchStatus = 'Queued' | 'Posted' | 'Failed' | 'Reversed'

export type FinancialPeriodStatus = 'Open' | 'Closed'

export type JournalLineSide = 'Debit' | 'Credit'

export type GLAccountMapping = {
  id: string
  sourceEventType: AccountingSourceEventType
  role: 'debit' | 'credit'
  glAccountCode: string
  glAccountName: string
  active: boolean
}

export type CostCenter = {
  code: string
  name: string
  active: boolean
}

export type ProfitCenter = {
  code: string
  name: string
  active: boolean
}

export type FinancialPeriod = {
  code: string
  label: string
  startDate: string
  endDate: string
  status: FinancialPeriodStatus
}

export type JournalLine = {
  id: string
  lineNo: number
  glAccountCode: string
  glAccountName: string
  side: JournalLineSide
  amount: number
  costCenterCode: string | null
  profitCenterCode: string | null
  description: string
}

export type JournalEntry = {
  id: string
  journalNo: string
  postingDate: string
  currency: string
  lines: JournalLine[]
  debitTotal: number
  creditTotal: number
  balanced: boolean
}

export type PostingError = {
  code: string
  message: string
  occurredAt: string
}

export type PostingResult = {
  postedAt: string
  postedBy: string
  externalRef: string | null
  debitTotal: number
  creditTotal: number
}

export type FinanceTimelineEntry = {
  id: string
  occurredAt: string
  actorUserId: string
  action: string
  note: string | null
}

/** Aggregate root — one posting batch / accounting integration unit */
export type AccountingIntegration = {
  id: string
  batchNo: string
  sourceEventType: AccountingSourceEventType
  sourceReferenceId: string
  sourceReferenceNo: string
  status: PostingBatchStatus
  financialPeriodCode: string
  costCenterCode: string | null
  profitCenterCode: string | null
  journalEntry: JournalEntry
  postingResult: PostingResult | null
  postingError: PostingError | null
  reverseOfBatchId: string | null
  reversedByBatchId: string | null
  costAnomalyScore: number
  profitabilityHint: string | null
  timeline: FinanceTimelineEntry[]
  idempotencyKey: string
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type EnqueueOperationalEventsInput = {
  idempotencyKey: string
  asOfDate?: string
}

export type PostBatchInput = {
  batchId: string
  idempotencyKey: string
}

export type ReverseBatchInput = {
  batchId: string
  idempotencyKey: string
  note?: string
}

export type UpsertGlMappingInput = {
  sourceEventType: AccountingSourceEventType
  role: 'debit' | 'credit'
  glAccountCode: string
  glAccountName: string
  idempotencyKey: string
}

export type CloseFinancialPeriodInput = {
  periodCode: string
  idempotencyKey: string
}

export type FinanceIntegrationBrainReadModel = {
  queued: number
  posted: number
  failed: number
  reversed: number
  totalDebitPosted: number
  totalCreditPosted: number
  avgCostAnomalyScore: number
  profitabilityInsights: Array<{
    batchId: string
    batchNo: string
    sourceEventType: AccountingSourceEventType
    hint: string
    costAnomalyScore: number
  }>
  costAnomalyEvents: Array<{
    batchId: string
    batchNo: string
    score: number
    sourceEventType: AccountingSourceEventType
  }>
}
