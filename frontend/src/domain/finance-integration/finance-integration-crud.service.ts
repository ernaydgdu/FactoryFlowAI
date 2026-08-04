/**
 * AccountingIntegration CRUD — event→journal integration layer.
 * Reuses operational aggregates via read-only queries (no duplicate write paths).
 */
import { queryAllExportDocumentSets } from '@/domain/commercial-documents/commercial-documents-query.service'
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { queryAllExportShipments } from '@/domain/export-logistics/export-logistics-query.service'
import { queryAllStockMovements } from '@/domain/inventory/stock-ledger-query.service'
import { queryAllProductCards } from '@/domain/product-card/product-card-crud.service'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'
import type { IAccountingIntegrationRepository } from '@/domain/ports/persistence/aggregates/accounting-integration.repository'
import type { PersistedAccountingIntegration } from '@/domain/ports/persistence/persistence-aggregates'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { queryAllGoodsReceipts } from '@/domain/purchasing/goods-receipt-query.service'
import { queryAllPurchaseOrders } from '@/domain/purchasing/purchase-order-query.service'

import type {
  AccountingIntegration,
  AccountingSourceEventType,
  CloseFinancialPeriodInput,
  EnqueueOperationalEventsInput,
  FinanceTimelineEntry,
  JournalEntry,
  JournalLine,
  PostBatchInput,
  ReverseBatchInput,
  UpsertGlMappingInput,
} from './finance-integration.types'

export class FinanceIntegrationDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FinanceIntegrationDomainError'
  }
}

function repo(): IAccountingIntegrationRepository {
  return requireUnitOfWork().accountingIntegrations
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function toDomain(row: PersistedAccountingIntegration): AccountingIntegration {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function appendTimeline(
  list: FinanceTimelineEntry[],
  actorUserId: string,
  action: string,
  note: string | null,
): FinanceTimelineEntry[] {
  return [
    ...list,
    {
      id: `ftl-${Date.now()}-${list.length}`,
      occurredAt: new Date().toISOString(),
      actorUserId,
      action,
      note,
    },
  ]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function assertBalanced(entry: JournalEntry): void {
  if (Math.abs(entry.debitTotal - entry.creditTotal) > 0.001) {
    throw new FinanceIntegrationDomainError(
      `Double-entry ihlali: Debit ${entry.debitTotal} ≠ Credit ${entry.creditTotal}`,
    )
  }
  if (!entry.balanced) {
    throw new FinanceIntegrationDomainError('JournalEntry.balanced=false')
  }
}

function resolvePeriodCode(asOfDate?: string): string {
  const d = (asOfDate ?? new Date().toISOString()).slice(0, 10)
  const periods = repo().listFinancialPeriods(DEFAULT_TENANT_ID)
  const hit = periods.find((p) => p.startDate <= d && p.endDate >= d)
  return hit?.code ?? periods.find((p) => p.status === 'Open')?.code ?? '2026-08'
}

function requireOpenPeriod(periodCode: string): void {
  const period = repo()
    .listFinancialPeriods(DEFAULT_TENANT_ID)
    .find((p) => p.code === periodCode)
  if (!period) throw new FinanceIntegrationDomainError(`Financial period yok: ${periodCode}`)
  if (period.status === 'Closed') {
    throw new FinanceIntegrationDomainError(
      `Closed financial period rejects postings: ${periodCode}`,
    )
  }
}

function mappingFor(type: AccountingSourceEventType, role: 'debit' | 'credit') {
  const m = repo()
    .listGlMappings(DEFAULT_TENANT_ID)
    .find((x) => x.sourceEventType === type && x.role === role && x.active)
  if (!m) {
    throw new FinanceIntegrationDomainError(`GL mapping eksik: ${type}/${role}`)
  }
  return m
}

function buildJournal(
  type: AccountingSourceEventType,
  amount: number,
  description: string,
  costCenterCode: string | null,
  profitCenterCode: string | null,
  postingDate: string,
): JournalEntry {
  const amt = round2(Math.abs(amount))
  if (amt <= 0) {
    throw new FinanceIntegrationDomainError('Posting amount > 0 olmalı.')
  }
  const debMap = mappingFor(type, 'debit')
  const credMap = mappingFor(type, 'credit')
  // Inventory adjustments: negative qty swaps sides conceptually via amount abs + standard map
  const lines: JournalLine[] = [
    {
      id: `jl-d-${Date.now()}`,
      lineNo: 1,
      glAccountCode: debMap.glAccountCode,
      glAccountName: debMap.glAccountName,
      side: 'Debit',
      amount: amt,
      costCenterCode,
      profitCenterCode,
      description,
    },
    {
      id: `jl-c-${Date.now()}`,
      lineNo: 2,
      glAccountCode: credMap.glAccountCode,
      glAccountName: credMap.glAccountName,
      side: 'Credit',
      amount: amt,
      costCenterCode,
      profitCenterCode,
      description,
    },
  ]
  const debitTotal = round2(lines.filter((l) => l.side === 'Debit').reduce((s, l) => s + l.amount, 0))
  const creditTotal = round2(
    lines.filter((l) => l.side === 'Credit').reduce((s, l) => s + l.amount, 0),
  )
  return {
    id: `je-${Date.now()}`,
    journalNo: `JE-PENDING`,
    postingDate,
    currency: 'USD',
    lines,
    debitTotal,
    creditTotal,
    balanced: Math.abs(debitTotal - creditTotal) <= 0.001,
  }
}

export function computeCostAnomalyScore(amount: number, sourceEventType: AccountingSourceEventType): number {
  let score = 0
  if (amount > 100_000) score += 40
  if (amount > 500_000) score += 30
  if (sourceEventType === 'InventoryAdjustment') score += 20
  if (sourceEventType === 'CostClosing' && amount > 50_000) score += 15
  return Math.min(100, score)
}

export function computeProfitabilityHint(
  sourceEventType: AccountingSourceEventType,
  amount: number,
): string | null {
  if (sourceEventType === 'CommercialInvoiceIssued') {
    return amount > 0 ? `AR revenue recognition ${round2(amount)}` : null
  }
  if (sourceEventType === 'ShipmentDeparted') {
    return `COGS recognition ${round2(amount)} — margin depends on invoice match`
  }
  if (sourceEventType === 'CostClosing') {
    return `Cost variance close ${round2(amount)}`
  }
  return null
}

function persist(
  entity: AccountingIntegration,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): AccountingIntegration {
  assertBalanced(entity.journalEntry)
  const now = new Date().toISOString()
  const persisted: PersistedAccountingIntegration = {
    ...entity,
    updatedAt: now,
    tenantId: DEFAULT_TENANT_ID,
    version: expectedVersion ?? 1,
    schemaVersion: 1,
    deletedAt: null,
  }
  const saved = repo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion != null ? expectedVersion : undefined,
  })
  logAudit(
    'AccountingIntegration',
    saved.id,
    changeType.startsWith('Enqueue') || changeType === 'Create' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.batchNo} — ${changeType}` },
    null,
    {
      batchNo: saved.batchNo,
      status: saved.status,
      sourceEventType: saved.sourceEventType,
      debitTotal: saved.journalEntry.debitTotal,
      creditTotal: saved.journalEntry.creditTotal,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-ai-${saved.id}-${Date.now()}`,
    entityType: 'INVOICE',
    entityId: saved.id,
    entityCode: saved.batchNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.sourceEventType} · ${saved.status}`,
  })
  scheduleSalesOrderChange({
    salesOrderId: saved.sourceReferenceId,
    orderNo: saved.sourceReferenceNo,
    status: saved.status,
    productCardId: 'n/a',
    changeType,
    occurredAt: now,
    actorUserId,
  })
  return toDomain(saved)
}

type SourceCandidate = {
  sourceEventType: AccountingSourceEventType
  sourceReferenceId: string
  sourceReferenceNo: string
  amount: number
  costCenterCode: string | null
  profitCenterCode: string | null
  description: string
}

/** Collect operational events eligible for accounting (read-only). */
export function collectOperationalSourceCandidates(): SourceCandidate[] {
  const out: SourceCandidate[] = []

  for (const po of queryAllProductionOrders()) {
    if (po.status === 'Completed' || po.status === 'Closed') {
      const qty = po.producedQty > 0 ? po.producedQty : po.plannedQty
      out.push({
        sourceEventType: 'ProductionComplete',
        sourceReferenceId: po.id,
        sourceReferenceNo: po.productionOrderNo,
        amount: round2(qty * 12),
        costCenterCode: 'CC-PROD',
        profitCenterCode: 'PC-EXPORT',
        description: `Production complete ${po.productionOrderNo}`,
      })
    }
  }

  for (const mv of queryAllStockMovements()) {
    if (mv.type === 'PRODUCTION_OUTPUT') {
      out.push({
        sourceEventType: 'FinishedGoodsReceipt',
        sourceReferenceId: mv.id,
        sourceReferenceNo: mv.movementNo,
        amount: round2(Math.abs(mv.quantity) * 12),
        costCenterCode: 'CC-WH',
        profitCenterCode: 'PC-EXPORT',
        description: `FG receipt ${mv.movementNo}`,
      })
    }
    if (mv.type === 'ADJUSTMENT') {
      out.push({
        sourceEventType: 'InventoryAdjustment',
        sourceReferenceId: mv.id,
        sourceReferenceNo: mv.movementNo,
        amount: round2(Math.abs(mv.quantity) * 8),
        costCenterCode: 'CC-WH',
        profitCenterCode: null,
        description: `Inventory adjustment ${mv.movementNo}`,
      })
    }
  }

  for (const exs of queryAllExportShipments()) {
    if (exs.status === 'Departed' || exs.status === 'Arrived' || exs.status === 'Closed') {
      out.push({
        sourceEventType: 'ShipmentDeparted',
        sourceReferenceId: exs.id,
        sourceReferenceNo: exs.exportShipmentNo,
        amount: round2(1000),
        costCenterCode: 'CC-WH',
        profitCenterCode: 'PC-EXPORT',
        description: `Shipment departed ${exs.exportShipmentNo}`,
      })
    }
  }

  for (const set of queryAllExportDocumentSets()) {
    if (set.commercialInvoice.status === 'Issued' || set.status === 'Issued') {
      out.push({
        sourceEventType: 'CommercialInvoiceIssued',
        sourceReferenceId: set.id,
        sourceReferenceNo: set.commercialInvoice.invoiceNo,
        amount: round2(set.commercialInvoice.totalAmount || set.commercialInvoice.totalQty * 25),
        costCenterCode: null,
        profitCenterCode: 'PC-EXPORT',
        description: `Commercial invoice ${set.commercialInvoice.invoiceNo}`,
      })
    }
  }

  for (const gr of queryAllGoodsReceipts()) {
    if (gr.status === 'Posted') {
      const qty = gr.lines.reduce((s, l) => s + l.quantity, 0)
      out.push({
        sourceEventType: 'PurchaseReceipt',
        sourceReferenceId: gr.id,
        sourceReferenceNo: gr.grNo,
        amount: round2(qty * 5),
        costCenterCode: 'CC-WH',
        profitCenterCode: null,
        description: `Purchase receipt ${gr.grNo}`,
      })
    }
  }

  for (const po of queryAllPurchaseOrders()) {
    if (po.status === 'Completed') {
      out.push({
        sourceEventType: 'PurchaseInvoice',
        sourceReferenceId: po.id,
        sourceReferenceNo: po.poNo,
        amount: round2(po.totalAmount > 0 ? po.totalAmount : 1),
        costCenterCode: null,
        profitCenterCode: null,
        description: `AP invoice proxy from PO ${po.poNo}`,
      })
    }
  }

  for (const card of queryAllProductCards()) {
    const cs = card.costSheet
    if (cs && (cs.status === 'Active' || cs.status === 'Approved') && cs.totalPlannedCost > 0) {
      out.push({
        sourceEventType: 'CostClosing',
        sourceReferenceId: card.id,
        sourceReferenceNo: card.productCode,
        amount: round2(cs.totalPlannedCost),
        costCenterCode: 'CC-PROD',
        profitCenterCode: 'PC-EXPORT',
        description: `Cost closing ${card.productCode}`,
      })
    }
  }

  return out
}

function createQueuedBatch(
  candidate: SourceCandidate,
  actorUserId: string,
  periodCode: string,
  postingDate: string,
  idempotencyKey: string,
): AccountingIntegration {
  const existing = repo().findBySourceEvent(
    DEFAULT_TENANT_ID,
    candidate.sourceEventType,
    candidate.sourceReferenceId,
  )
  if (existing) return toDomain(existing)

  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, idempotencyKey)
  if (byKey) return toDomain(byKey)

  const n = repo().nextBatchCounter()
  const batchNo = `PB-${String(n).padStart(6, '0')}`
  const journal = buildJournal(
    candidate.sourceEventType,
    candidate.amount,
    candidate.description,
    candidate.costCenterCode,
    candidate.profitCenterCode,
    postingDate,
  )
  journal.journalNo = `JE-${String(n).padStart(6, '0')}`
  assertBalanced(journal)

  const anomaly = computeCostAnomalyScore(candidate.amount, candidate.sourceEventType)
  const now = new Date().toISOString()
  const entity: AccountingIntegration = {
    id: `ai-${n}`,
    batchNo,
    sourceEventType: candidate.sourceEventType,
    sourceReferenceId: candidate.sourceReferenceId,
    sourceReferenceNo: candidate.sourceReferenceNo,
    status: 'Queued',
    financialPeriodCode: periodCode,
    costCenterCode: candidate.costCenterCode,
    profitCenterCode: candidate.profitCenterCode,
    journalEntry: journal,
    postingResult: null,
    postingError: null,
    reverseOfBatchId: null,
    reversedByBatchId: null,
    costAnomalyScore: anomaly,
    profitabilityHint: computeProfitabilityHint(candidate.sourceEventType, candidate.amount),
    timeline: appendTimeline([], actorUserId, 'Enqueue', candidate.description),
    idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(entity, actorUserId, `Enqueue${candidate.sourceEventType}`)
}

export function persistEnqueueOperationalEvents(
  input: EnqueueOperationalEventsInput,
  actorUserId: string,
): AccountingIntegration[] {
  if (!input.idempotencyKey?.trim()) {
    throw new FinanceIntegrationDomainError('idempotencyKey zorunlu.')
  }
  repo().ensureCatalogSeeded(DEFAULT_TENANT_ID)
  const periodCode = resolvePeriodCode(input.asOfDate)
  const postingDate = (input.asOfDate ?? new Date().toISOString()).slice(0, 10)
  const candidates = collectOperationalSourceCandidates()
  const created: AccountingIntegration[] = []
  for (const c of candidates) {
    const key = `${input.idempotencyKey}:${c.sourceEventType}:${c.sourceReferenceId}`
    created.push(createQueuedBatch(c, actorUserId, periodCode, postingDate, key))
  }
  return created
}

export function persistPostBatch(
  input: PostBatchInput,
  actorUserId: string,
): AccountingIntegration {
  if (!input.idempotencyKey?.trim()) {
    throw new FinanceIntegrationDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, `post-${input.idempotencyKey}`)
  if (byKey) return toDomain(byKey)

  const row = repo().findById(DEFAULT_TENANT_ID, input.batchId)
  if (!row) throw new FinanceIntegrationDomainError(`Batch bulunamadı: ${input.batchId}`)
  const current = toDomain(row)
  if (current.status === 'Posted') return current
  if (current.status === 'Reversed') {
    throw new FinanceIntegrationDomainError('Reversed batch tekrar post edilemez.')
  }

  try {
    requireOpenPeriod(current.financialPeriodCode)
    assertBalanced(current.journalEntry)
    const now = new Date().toISOString()
    return persist(
      {
        ...current,
        status: 'Posted',
        postingResult: {
          postedAt: now,
          postedBy: actorUserId,
          externalRef: `EXT-${current.batchNo}`,
          debitTotal: current.journalEntry.debitTotal,
          creditTotal: current.journalEntry.creditTotal,
        },
        postingError: null,
        timeline: appendTimeline(current.timeline, actorUserId, 'Post', null),
        idempotencyKey: `post-${input.idempotencyKey}`,
      },
      actorUserId,
      'PostBatch',
      row.version,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Posting failed'
    const now = new Date().toISOString()
    return persist(
      {
        ...current,
        status: 'Failed',
        postingError: { code: 'POST_FAILED', message, occurredAt: now },
        timeline: appendTimeline(current.timeline, actorUserId, 'PostFailed', message),
        idempotencyKey: `post-fail-${input.idempotencyKey}`,
      },
      actorUserId,
      'PostBatchFailed',
      row.version,
    )
  }
}

export function persistReverseBatch(
  input: ReverseBatchInput,
  actorUserId: string,
): AccountingIntegration {
  if (!input.idempotencyKey?.trim()) {
    throw new FinanceIntegrationDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = repo().findById(DEFAULT_TENANT_ID, input.batchId)
  if (!row) throw new FinanceIntegrationDomainError(`Batch bulunamadı: ${input.batchId}`)
  const original = toDomain(row)
  if (original.status !== 'Posted') {
    throw new FinanceIntegrationDomainError('Yalnızca Posted batch reverse edilebilir.')
  }
  if (original.reversedByBatchId) {
    throw new FinanceIntegrationDomainError('Batch zaten reverse edilmiş.')
  }
  requireOpenPeriod(original.financialPeriodCode)

  const n = repo().nextBatchCounter()
  const batchNo = `PB-${String(n).padStart(6, '0')}`
  const now = new Date().toISOString()
  const reversedLines: JournalLine[] = original.journalEntry.lines.map((l, i) => ({
    ...l,
    id: `jl-rev-${n}-${i}`,
    side: l.side === 'Debit' ? 'Credit' : 'Debit',
    description: `REV · ${l.description}`,
  }))
  const debitTotal = round2(
    reversedLines.filter((l) => l.side === 'Debit').reduce((s, l) => s + l.amount, 0),
  )
  const creditTotal = round2(
    reversedLines.filter((l) => l.side === 'Credit').reduce((s, l) => s + l.amount, 0),
  )
  const journal: JournalEntry = {
    id: `je-rev-${n}`,
    journalNo: `JE-${String(n).padStart(6, '0')}`,
    postingDate: now.slice(0, 10),
    currency: original.journalEntry.currency,
    lines: reversedLines,
    debitTotal,
    creditTotal,
    balanced: Math.abs(debitTotal - creditTotal) <= 0.001,
  }
  assertBalanced(journal)

  const reversing: AccountingIntegration = {
    id: `ai-${n}`,
    batchNo,
    sourceEventType: original.sourceEventType,
    sourceReferenceId: original.sourceReferenceId,
    sourceReferenceNo: original.sourceReferenceNo,
    status: 'Posted',
    financialPeriodCode: original.financialPeriodCode,
    costCenterCode: original.costCenterCode,
    profitCenterCode: original.profitCenterCode,
    journalEntry: journal,
    postingResult: {
      postedAt: now,
      postedBy: actorUserId,
      externalRef: `REV-${original.batchNo}`,
      debitTotal,
      creditTotal,
    },
    postingError: null,
    reverseOfBatchId: original.id,
    reversedByBatchId: null,
    costAnomalyScore: original.costAnomalyScore,
    profitabilityHint: `Reversal of ${original.batchNo}`,
    timeline: appendTimeline([], actorUserId, 'Reverse', input.note ?? `Reverse ${original.batchNo}`),
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  const savedRev = persist(reversing, actorUserId, 'ReverseBatch')
  persist(
    {
      ...original,
      status: 'Reversed',
      reversedByBatchId: savedRev.id,
      timeline: appendTimeline(original.timeline, actorUserId, 'MarkedReversed', savedRev.batchNo),
    },
    actorUserId,
    'MarkOriginalReversed',
    row.version,
  )
  return savedRev
}

export function persistUpsertGlMapping(
  input: UpsertGlMappingInput,
  actorUserId: string,
): ReturnType<IAccountingIntegrationRepository['upsertGlMapping']> {
  if (!input.idempotencyKey?.trim()) {
    throw new FinanceIntegrationDomainError('idempotencyKey zorunlu.')
  }
  repo().ensureCatalogSeeded(DEFAULT_TENANT_ID)
  const mapping = repo().upsertGlMapping(DEFAULT_TENANT_ID, {
    id: `glm-${input.sourceEventType}-${input.role}`,
    sourceEventType: input.sourceEventType,
    role: input.role,
    glAccountCode: input.glAccountCode.trim(),
    glAccountName: input.glAccountName.trim(),
    active: true,
  })
  logAudit(
    'AccountingIntegration',
    mapping.id,
    'UPDATE',
    { ...auditContext(actorUserId), description: `GL map ${mapping.sourceEventType}/${mapping.role}` },
    null,
    mapping,
  )
  return mapping
}

export function persistCloseFinancialPeriod(
  input: CloseFinancialPeriodInput,
  actorUserId: string,
): ReturnType<IAccountingIntegrationRepository['upsertFinancialPeriod']> {
  if (!input.idempotencyKey?.trim()) {
    throw new FinanceIntegrationDomainError('idempotencyKey zorunlu.')
  }
  const periods = repo().listFinancialPeriods(DEFAULT_TENANT_ID)
  const period = periods.find((p) => p.code === input.periodCode)
  if (!period) throw new FinanceIntegrationDomainError(`Period yok: ${input.periodCode}`)
  if (period.status === 'Closed') return period
  const queued = repo()
    .cursor(DEFAULT_TENANT_ID, { status: 'Queued' }, { limit: 50 })
    .items.filter((b) => b.financialPeriodCode === input.periodCode)
  if (queued.length > 0) {
    throw new FinanceIntegrationDomainError(
      `Period close engellendi: ${queued.length} Queued posting var.`,
    )
  }
  const closed = repo().upsertFinancialPeriod(DEFAULT_TENANT_ID, { ...period, status: 'Closed' })
  logAudit(
    'AccountingIntegration',
    closed.code,
    'UPDATE',
    { ...auditContext(actorUserId), description: `Close period ${closed.code}` },
    { status: period.status },
    { status: closed.status },
  )
  return closed
}
