/**
 * StyleClosing CRUD — final textile style completion.
 * Read-only reuse of Sales/MRP/Purchasing/Inventory/Warehouse/Production/Quality/
 * Shipment/Commercial Docs/Finance/Cost Closing (no duplicate repositories).
 */
import { queryAllExportDocumentSets } from '@/domain/commercial-documents/commercial-documents-query.service'
import { queryAllCostClosings } from '@/domain/cost-closing/cost-closing-query.service'
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { getOperationExecutions } from '@/domain/execution-platform/operation-execution-service'
import { queryAllAccountingIntegrations } from '@/domain/finance-integration/finance-integration-query.service'
import {
  queryAllBalances,
  queryAllStockMovements,
  queryReservationMovements,
} from '@/domain/inventory/stock-ledger-query.service'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'
import type { IStyleClosingRepository } from '@/domain/ports/persistence/aggregates/style-closing.repository'
import type { PersistedStyleClosing } from '@/domain/ports/persistence/persistence-aggregates'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import {
  approveStep,
  isFullyApproved,
  submitForApproval,
} from '@/domain/platform/services/approval-service'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { queryAllProductCards } from '@/domain/product-card/product-card-crud.service'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'
import { queryAllGoodsReceipts } from '@/domain/purchasing/goods-receipt-query.service'
import { queryAllPurchaseOrders } from '@/domain/purchasing/purchase-order-query.service'
import { listHoldQueue } from '@/domain/quality/quality-query.service'
import { listNcrRecords } from '@/domain/quality/ncr-capa.service'
import { queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { queryAllShipments } from '@/domain/shipment/shipment-query.service'

import type {
  ApproveStyleClosingInput,
  CompletionChecklistItem,
  CreateStyleClosingInput,
  MissingRequirement,
  StyleClosing,
  StyleClosingStatus,
  StyleClosingTimelineEntry,
  StyleClosingTransitionInput,
  StyleKpiSnapshot,
} from './style-closing.types'

export class StyleClosingDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StyleClosingDomainError'
  }
}

function repo(): IStyleClosingRepository {
  return requireUnitOfWork().styleClosings
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function toDomain(row: PersistedStyleClosing): StyleClosing {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function appendTimeline(
  list: StyleClosingTimelineEntry[],
  status: StyleClosingStatus,
  actorUserId: string,
  action: string,
  note: string | null,
): StyleClosingTimelineEntry[] {
  return [
    ...list,
    {
      id: `stl-${Date.now()}-${list.length}`,
      occurredAt: new Date().toISOString(),
      actorUserId,
      action,
      note,
      status,
    },
  ]
}

function assertMutable(current: StyleClosing): void {
  if (current.status === 'Closed') {
    throw new StyleClosingDomainError('Closed styles are immutable.')
  }
}

const SO_DONE = new Set(['Closed', 'Archived', 'Cancelled'])
const PO_PROD_DONE = new Set(['Closed', 'Cancelled'])
const PO_PURCH_DONE = new Set(['Completed', 'Closed', 'Cancelled', 'Archived'])
const SHIP_DONE = new Set(['Delivered', 'Closed', 'Cancelled'])

export function computeStyleAnomalyScore(
  missingCount: number,
  marginPercent: number,
  openNcr: number,
): number {
  let score = missingCount * 7
  if (marginPercent < 5) score += 25
  if (marginPercent < 0) score += 20
  score += openNcr * 10
  return Math.min(100, score)
}

export function computeStyleProfitabilityHint(marginPercent: number, missingCount: number): string {
  if (missingCount > 0) return `${missingCount} open requirements block style close`
  if (marginPercent < 0) return `Negative margin ${round2(marginPercent)}% — investigate cost`
  if (marginPercent < 8) return `Thin margin ${round2(marginPercent)}%`
  return `Healthy style margin ${round2(marginPercent)}%`
}

/** Auditable completion checklist for a style (product card). */
export function evaluateStyleChecklist(productCardId: string): CompletionChecklistItem[] {
  const salesOrders = queryAllSalesOrders().filter((o) => o.productCardId === productCardId)
  const soOk =
    salesOrders.length > 0 &&
    salesOrders.every(
      (o) =>
        SO_DONE.has(o.status) ||
        o.productionStatus === 'Tamamlandı' ||
        o.productionStatus === 'Sevk Edildi',
    )

  const production = queryAllProductionOrders().filter((p) => p.productCardId === productCardId)
  const prodOk = production.length > 0 && production.every((p) => PO_PROD_DONE.has(p.status))
  const soIds = new Set(salesOrders.map((o) => o.id))

  const purchase = queryAllPurchaseOrders().filter(
    (p) => soIds.has(p.sourceOrderId) || production.some((po) => po.salesOrderId === p.sourceOrderId),
  )
  const purchApplicable = purchase.length > 0
  const purchOk =
    !purchApplicable || purchase.every((p) => PO_PURCH_DONE.has(p.status))

  const mrp = queryLatestMrpRun()
  const mrpOk = !!mrp && (mrp.status === 'Released' || mrp.status === 'Approved' || mrp.status === 'Calculated')

  const balances = queryAllBalances()
  const negative = balances.filter((b) => b.available < 0)
  const invOk = negative.length === 0

  const draftGr = queryAllGoodsReceipts().filter((g) => g.status === 'Draft')
  const whOk = draftGr.length === 0

  const prodNos = new Set(production.map((p) => p.productionOrderNo))
  const openNcrs = listNcrRecords().filter(
    (n) => n.status === 'Open' && prodNos.has(n.productionOrderNo),
  )
  const holds = listHoldQueue().filter((h) => prodNos.has(h.productionOrderNo))
  const qualityOk = openNcrs.length === 0 && holds.length === 0

  const shipments = queryAllShipments().filter((s) => soIds.has(s.salesOrderId))
  const shipApplicable = shipments.length > 0
  const shipOk = !shipApplicable || shipments.every((s) => SHIP_DONE.has(s.status))

  const docs = queryAllExportDocumentSets().filter((d) => soIds.has(d.salesOrderId))
  const docsApplicable = docs.length > 0
  const docsOk =
    !docsApplicable ||
    docs.every((d) => d.status === 'Issued' && d.commercialInvoice.status === 'Issued')

  const finance = queryAllAccountingIntegrations().filter((b) => {
    return (
      soIds.has(b.sourceReferenceId) ||
      docs.some((d) => d.id === b.sourceReferenceId) ||
      shipments.some((s) => s.id === b.sourceReferenceId) ||
      production.some((p) => p.id === b.sourceReferenceId)
    )
  })
  const openFin = finance.filter((b) => b.status === 'Queued' || b.status === 'Failed')
  const accountingOk =
    finance.length > 0 &&
    openFin.length === 0 &&
    finance.every((b) => b.status === 'Posted' || b.status === 'Reversed')

  const costClosings = queryAllCostClosings().filter((c) => soIds.has(c.salesOrderId))
  const costOk =
    costClosings.length > 0 &&
    costClosings.every((c) => c.status === 'Approved' || c.status === 'Closed')

  const reservations = queryReservationMovements()
  const pendingRes =
    production.some((p) => p.reservationApplied && !PO_PROD_DONE.has(p.status)) ||
    reservations.filter((m) => m.type === 'RESERVATION').length >
      reservations.filter((m) => m.type === 'RESERVATION_RELEASE').length

  const openWork = production.some((p) => {
    if (PO_PROD_DONE.has(p.status)) return false
    try {
      return getOperationExecutions(p.productionOrderNo).some(
        (op) => op.status !== 'Completed' && op.status !== 'Blocked',
      )
    } catch {
      return p.status === 'In Production' || p.status === 'Released'
    }
  })

  void queryAllStockMovements

  return [
    {
      code: 'ALL_SALES_ORDERS_COMPLETED',
      label: 'All Sales Orders completed',
      passed: soOk,
      applicable: true,
      detail: soOk
        ? `${salesOrders.length} SO completed`
        : `${salesOrders.filter((o) => !SO_DONE.has(o.status)).length} open SO`,
    },
    {
      code: 'ALL_PRODUCTION_ORDERS_CLOSED',
      label: 'All Production Orders closed',
      passed: prodOk,
      applicable: true,
      detail: prodOk
        ? `${production.length} PO closed`
        : `${production.filter((p) => !PO_PROD_DONE.has(p.status)).length} open production`,
    },
    {
      code: 'ALL_PURCHASE_ORDERS_CLOSED',
      label: 'All Purchase Orders closed',
      passed: purchOk,
      applicable: purchApplicable,
      detail: purchApplicable
        ? purchOk
          ? `${purchase.length} purch PO closed`
          : 'Open purchase orders remain'
        : 'N/A — no purchase orders',
    },
    {
      code: 'MRP_COMPLETED',
      label: 'MRP completed',
      passed: mrpOk,
      applicable: true,
      detail: mrp ? `MRP ${mrp.runNo} status=${mrp.status}` : 'No MRP run',
    },
    {
      code: 'INVENTORY_RECONCILED',
      label: 'Inventory reconciled',
      passed: invOk,
      applicable: true,
      detail: invOk ? 'No negative balances' : `${negative.length} negative balance(s)`,
    },
    {
      code: 'WAREHOUSE_RECONCILED',
      label: 'Warehouse reconciled',
      passed: whOk,
      applicable: true,
      detail: whOk ? 'No Draft GR' : `${draftGr.length} Draft GR`,
    },
    {
      code: 'QUALITY_APPROVED',
      label: 'Quality approved',
      passed: qualityOk,
      applicable: true,
      detail: qualityOk
        ? 'No open NCR/hold'
        : `NCR=${openNcrs.length} hold=${holds.length}`,
    },
    {
      code: 'SHIPMENTS_COMPLETED',
      label: 'Shipments completed',
      passed: shipOk,
      applicable: shipApplicable,
      detail: shipApplicable
        ? shipOk
          ? `${shipments.length} shipments done`
          : 'Open shipments remain'
        : 'N/A — no shipments',
    },
    {
      code: 'COMMERCIAL_DOCS_ISSUED',
      label: 'Commercial documents issued',
      passed: docsOk,
      applicable: docsApplicable,
      detail: docsApplicable
        ? docsOk
          ? 'Docs Issued'
          : 'Docs not Issued'
        : 'N/A — no export docs',
    },
    {
      code: 'ACCOUNTING_POSTINGS_COMPLETE',
      label: 'Accounting postings complete',
      passed: accountingOk,
      applicable: true,
      detail: accountingOk
        ? `${finance.length} Posted`
        : openFin.length
          ? `${openFin.length} open/failed`
          : 'No Posted accounting for style',
    },
    {
      code: 'COST_CLOSING_APPROVED',
      label: 'Cost Closing approved',
      passed: costOk,
      applicable: true,
      detail: costOk
        ? `${costClosings.length} cost closing Approved/Closed`
        : costClosings.length
          ? 'Cost closing not Approved'
          : 'No cost closing for style SOs',
    },
    {
      code: 'NO_OPEN_NCR',
      label: 'No open NCR',
      passed: openNcrs.length === 0,
      applicable: true,
      detail: openNcrs.length === 0 ? 'No open NCR' : `${openNcrs.length} open NCR`,
    },
    {
      code: 'NO_PENDING_RESERVATIONS',
      label: 'No pending reservations',
      passed: !pendingRes,
      applicable: true,
      detail: pendingRes ? 'Pending reservations exist' : 'Reservations clear',
    },
    {
      code: 'NO_OPEN_WORK_ORDERS',
      label: 'No open work orders',
      passed: !openWork,
      applicable: true,
      detail: openWork ? 'Open operation executions' : 'No open work orders',
    },
  ]
}

function buildKpi(productCardId: string, checklist: CompletionChecklistItem[]): StyleKpiSnapshot {
  const salesOrders = queryAllSalesOrders().filter((o) => o.productCardId === productCardId)
  const soIds = new Set(salesOrders.map((o) => o.id))
  const production = queryAllProductionOrders().filter((p) => p.productCardId === productCardId)
  const producedQty = production.reduce((s, p) => s + p.producedQty, 0)
  const shipments = queryAllShipments().filter((s) => soIds.has(s.salesOrderId))
  const shippedQty = shipments.reduce((s, sh) => s + sh.totals.totalQty, 0)
  const card = queryAllProductCards().find((c) => c.id === productCardId)
  const planned = card?.costSheet.totalPlannedCost ?? 0
  const costClosings = queryAllCostClosings().filter((c) => soIds.has(c.salesOrderId))
  const totalVariance = costClosings.reduce((s, c) => s + (c.variances?.totalVariance ?? 0), 0)
  const revenue = salesOrders.reduce(
    (s, o) => s + (o.unitPrice ?? 0) * (o.matrixTotals?.grandTotal ?? producedQty),
    0,
  )
  const actualCost = planned + totalVariance
  const margin = revenue - actualCost
  const marginPercent = revenue > 0 ? round2((margin / revenue) * 100) : 0
  const openNcr = listNcrRecords().filter(
    (n) =>
      n.status === 'Open' &&
      production.some((p) => p.productionOrderNo === n.productionOrderNo),
  ).length
  void checklist
  return {
    salesOrderCount: salesOrders.length,
    productionOrderCount: production.length,
    producedQty,
    shippedQty,
    openNcrCount: openNcr,
    totalPlannedCost: round2(planned),
    totalVariance: round2(totalVariance),
    revenueEstimate: round2(revenue),
    finalMargin: round2(margin),
    marginPercent,
    capturedAt: new Date().toISOString(),
  }
}

function persist(
  entity: StyleClosing,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): StyleClosing {
  const now = new Date().toISOString()
  const persisted: PersistedStyleClosing = {
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
    'StyleClosing',
    saved.id,
    changeType === 'CreateStyleClosing' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.batchNo} — ${changeType}` },
    null,
    {
      batchNo: saved.batchNo,
      status: saved.status,
      productCode: saved.productCode,
      missing: saved.missingRequirements.length,
      anomalyScore: saved.anomalyScore,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-sc-${saved.id}-${Date.now()}`,
    entityType: 'PRODUCT_CARD',
    entityId: saved.productCardId,
    entityCode: saved.productCode,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.batchNo} · ${saved.status}`,
  })
  scheduleSalesOrderChange({
    salesOrderId: saved.productCardId,
    orderNo: saved.productCode,
    status: saved.status,
    productCardId: saved.productCardId,
    changeType,
    occurredAt: now,
    actorUserId,
  })
  return toDomain(saved)
}

function requireStyle(id: string): PersistedStyleClosing {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new StyleClosingDomainError(`Style closing bulunamadı: ${id}`)
  return row
}

export function persistCreateStyleClosing(
  input: CreateStyleClosingInput,
  actorUserId: string,
): StyleClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new StyleClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const existing = repo().findByProductCardId(DEFAULT_TENANT_ID, input.productCardId)
  if (existing && existing.status !== 'Closed') return toDomain(existing)

  const card = queryAllProductCards().find((c) => c.id === input.productCardId)
  if (!card) throw new StyleClosingDomainError(`Product/style bulunamadı: ${input.productCardId}`)

  const n = repo().nextBatchCounter()
  const now = new Date().toISOString()
  const entity: StyleClosing = {
    id: `sc-${n}`,
    batchNo: `SC-${String(n).padStart(6, '0')}`,
    productCardId: card.id,
    productCode: card.productCode,
    productName: card.productName,
    status: 'Open',
    checklist: [],
    missingRequirements: [],
    kpiSnapshot: null,
    finalMargin: null,
    finalConsumption: null,
    finalCost: null,
    finalShipmentSummary: null,
    finalQualitySummary: null,
    approvalWorkflowId: null,
    approvalStatus: 'None',
    anomalyScore: 0,
    profitabilityHint: null,
    timeline: appendTimeline([], 'Open', actorUserId, 'Create', null),
    closedAt: null,
    closedBy: null,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(entity, actorUserId, 'CreateStyleClosing')
}

function applyCheckResults(current: StyleClosing, actorUserId: string, note: string | null) {
  const checklist = evaluateStyleChecklist(current.productCardId)
  const missing: MissingRequirement[] = checklist
    .filter((c) => c.applicable && !c.passed)
    .map((c) => ({ code: c.code, detail: c.detail }))
  const kpi = buildKpi(current.productCardId, checklist)
  const planned = kpi.totalPlannedCost
  const actual = planned + kpi.totalVariance
  const anomaly = computeStyleAnomalyScore(missing.length, kpi.marginPercent, kpi.openNcrCount)
  const allPass = missing.length === 0
  const soIds = new Set(
    queryAllSalesOrders()
      .filter((o) => o.productCardId === current.productCardId)
      .map((o) => o.id),
  )
  const shipments = queryAllShipments().filter((s) => soIds.has(s.salesOrderId))

  return {
    ...current,
    status: (allPass ? 'Ready' : 'Checking') as StyleClosingStatus,
    checklist,
    missingRequirements: missing,
    kpiSnapshot: kpi,
    finalMargin: {
      revenue: kpi.revenueEstimate,
      cost: round2(actual),
      margin: kpi.finalMargin,
      marginPercent: kpi.marginPercent,
    },
    finalConsumption: {
      materialPlanned: round2(planned * 0.6),
      materialActual: round2(planned * 0.6 + kpi.totalVariance * 0.4),
      variance: round2(kpi.totalVariance * 0.4),
    },
    finalCost: {
      planned: round2(planned),
      actual: round2(actual),
      variance: kpi.totalVariance,
    },
    finalShipmentSummary: {
      shipmentCount: shipments.length,
      totalQty: kpi.shippedQty,
      allCompleted: shipments.length === 0 || shipments.every((s) => SHIP_DONE.has(s.status)),
    },
    finalQualitySummary: {
      openNcr: kpi.openNcrCount,
      holdCount: listHoldQueue().filter((h) =>
        queryAllProductionOrders().some(
          (p) => p.productCardId === current.productCardId && p.productionOrderNo === h.productionOrderNo,
        ),
      ).length,
      approved: kpi.openNcrCount === 0,
    },
    anomalyScore: anomaly,
    profitabilityHint: computeStyleProfitabilityHint(kpi.marginPercent, missing.length),
    timeline: appendTimeline(
      current.timeline,
      allPass ? 'Ready' : 'Checking',
      actorUserId,
      'Check',
      note ?? `${missing.length} missing`,
    ),
  }
}

export function persistCheckStyleClosing(
  input: StyleClosingTransitionInput,
  actorUserId: string,
): StyleClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new StyleClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireStyle(input.styleClosingId)
  const current = toDomain(row)
  assertMutable(current)
  if (current.status !== 'Open' && current.status !== 'Checking' && current.status !== 'Ready') {
    throw new StyleClosingDomainError(`Check yalnızca Open/Checking/Ready: ${current.status}`)
  }

  const next = applyCheckResults(current, actorUserId, input.note ?? null)
  return persist(
    { ...next, idempotencyKey: input.idempotencyKey },
    actorUserId,
    'CheckStyleClosing',
    row.version,
  )
}

export function persistSubmitStyleClosingApproval(
  input: StyleClosingTransitionInput,
  actorUserId: string,
): StyleClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new StyleClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireStyle(input.styleClosingId)
  const current = toDomain(row)
  assertMutable(current)
  if (current.status !== 'Ready') {
    throw new StyleClosingDomainError('Approval submit için Ready gerekli (tüm checklist PASS).')
  }

  const workflow = submitForApproval({
    workflowType: 'StyleClosing',
    entityType: 'StyleClosing',
    entityId: current.id,
    entityKey: current.batchNo,
    submittedBy: actorUserId,
  })

  return persist(
    {
      ...current,
      approvalWorkflowId: workflow.id,
      approvalStatus: 'Pending',
      timeline: appendTimeline(
        current.timeline,
        'Ready',
        actorUserId,
        'SubmitApproval',
        workflow.id,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'SubmitStyleClosingApproval',
    row.version,
  )
}

export function persistApproveStyleClosing(
  input: ApproveStyleClosingInput,
  actorUserId: string,
): StyleClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new StyleClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireStyle(input.styleClosingId)
  const current = toDomain(row)
  assertMutable(current)
  if (!current.approvalWorkflowId) {
    throw new StyleClosingDomainError('Approval workflow yok — önce submit.')
  }

  const wf = approveStep(current.approvalWorkflowId, actorUserId, input.comment)
  if (!wf) throw new StyleClosingDomainError('Approval step başarısız.')
  const approved = isFullyApproved(wf)

  return persist(
    {
      ...current,
      status: approved ? 'Approved' : current.status,
      approvalStatus: approved ? 'Approved' : 'Pending',
      timeline: appendTimeline(
        current.timeline,
        approved ? 'Approved' : current.status,
        actorUserId,
        approved ? 'Approved' : 'ApprovalStep',
        input.comment ?? null,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'ApproveStyleClosing',
    row.version,
  )
}

export function persistCloseStyleClosing(
  input: StyleClosingTransitionInput,
  actorUserId: string,
): StyleClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new StyleClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireStyle(input.styleClosingId)
  const current = toDomain(row)
  if (current.status === 'Closed') return current
  assertMutable(current)

  if (current.status !== 'Approved') {
    throw new StyleClosingDomainError('Close için Approved gerekli.')
  }

  const checklist = evaluateStyleChecklist(current.productCardId)
  const missing = checklist.filter((c) => c.applicable && !c.passed)
  if (missing.length > 0) {
    throw new StyleClosingDomainError(
      `Close engellendi: ${missing.map((m) => m.code).join(', ')}`,
    )
  }

  const now = new Date().toISOString()
  return persist(
    {
      ...current,
      status: 'Closed',
      checklist,
      missingRequirements: [],
      closedAt: now,
      closedBy: actorUserId,
      timeline: appendTimeline(current.timeline, 'Closed', actorUserId, 'Close', input.note ?? null),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'CloseStyleClosing',
    row.version,
  )
}
