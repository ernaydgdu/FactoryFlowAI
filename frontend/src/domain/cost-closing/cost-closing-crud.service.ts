/**
 * CostClosing CRUD — manufacturing financial completion.
 * Read-only reuse of Production / Inventory / Shipment / Commercial Docs / Finance.
 */
import { queryAllExportDocumentSets } from '@/domain/commercial-documents/commercial-documents-query.service'
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { queryAllAccountingIntegrations } from '@/domain/finance-integration/finance-integration-query.service'
import { queryAllStockMovements } from '@/domain/inventory/stock-ledger-query.service'
import type { ICostClosingRepository } from '@/domain/ports/persistence/aggregates/cost-closing.repository'
import type { PersistedCostClosing } from '@/domain/ports/persistence/persistence-aggregates'
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
import { querySalesOrderById } from '@/domain/sales-order/sales-order-query.service'
import { queryAllShipments } from '@/domain/shipment/shipment-query.service'

import type {
  ApproveCostClosingInput,
  CostClosing,
  CostClosingGate,
  CostClosingStatus,
  CostClosingTimelineEntry,
  CostClosingTransitionInput,
  CostVarianceBundle,
  CreateCostClosingInput,
  FinancialReconciliation,
  InventoryRevaluation,
} from './cost-closing.types'

export class CostClosingDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CostClosingDomainError'
  }
}

function repo(): ICostClosingRepository {
  return requireUnitOfWork().costClosings
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function toDomain(row: PersistedCostClosing): CostClosing {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function appendTimeline(
  list: CostClosingTimelineEntry[],
  status: CostClosingStatus,
  actorUserId: string,
  action: string,
  note: string | null,
): CostClosingTimelineEntry[] {
  return [
    ...list,
    {
      id: `ctl-${Date.now()}-${list.length}`,
      occurredAt: new Date().toISOString(),
      actorUserId,
      action,
      note,
      status,
    },
  ]
}

function assertNotImmutable(current: CostClosing): void {
  if (current.status === 'Closed') {
    throw new CostClosingDomainError('Closed periods / cost closings are immutable.')
  }
}

export function computeAnomalyScore(totalVariance: number, failedGates: number): number {
  let score = 0
  if (Math.abs(totalVariance) > 10_000) score += 35
  if (Math.abs(totalVariance) > 50_000) score += 25
  score += failedGates * 8
  return Math.min(100, score)
}

export function computeProfitabilityHint(variances: CostVarianceBundle | null): string | null {
  if (!variances) return null
  if (variances.totalVariance > 0) {
    return `Unfavorable variance ${round2(variances.totalVariance)} — margin pressure`
  }
  if (variances.totalVariance < 0) {
    return `Favorable variance ${round2(Math.abs(variances.totalVariance))} — margin upside`
  }
  return 'On-plan cost close'
}

function buildVariances(productCardId: string, salesOrderId: string): CostVarianceBundle {
  const card = queryAllProductCards().find((c) => c.id === productCardId)
  const cs = card?.costSheet
  const pos = queryAllProductionOrders().filter((p) => p.salesOrderId === salesOrderId)
  const produced = pos.reduce((s, p) => s + p.producedQty, 0)
  const plannedQty = pos.reduce((s, p) => s + p.plannedQty, 0) || 1

  const snap = pos[0]?.snapshots?.cost
  const plannedBase = cs?.totalPlannedCost ?? 0
  const fabric = snap?.fabric ?? plannedBase * 0.45
  const accessory = snap?.accessory ?? plannedBase * 0.15
  const labor = snap?.labor ?? plannedBase * 0.25
  const overhead = snap?.overhead ?? plannedBase * 0.15
  const plannedTotal = fabric + accessory + labor + overhead || plannedBase

  const scale = produced / plannedQty
  const actualMaterial = round2((fabric + accessory) * Math.max(scale, 0.01))
  const actualLabor = round2(labor * Math.max(scale, 0.01))
  const actualOverhead = round2(overhead * Math.max(scale, 0.01))
  const actualProduction = round2(plannedTotal * Math.max(scale, 0.01))

  const materialPlanned = round2(fabric + accessory)
  const materialVar = round2(actualMaterial - materialPlanned)
  const laborVar = round2(actualLabor - labor)
  const ohVar = round2(actualOverhead - overhead)
  const prodVar = round2(actualProduction - plannedTotal)

  return {
    material: {
      code: 'MAT',
      label: 'Material Variance',
      planned: materialPlanned,
      actual: actualMaterial,
      variance: materialVar,
    },
    labor: {
      code: 'LAB',
      label: 'Labor Variance',
      planned: round2(labor),
      actual: actualLabor,
      variance: laborVar,
    },
    overhead: {
      code: 'OH',
      label: 'Overhead Variance',
      planned: round2(overhead),
      actual: actualOverhead,
      variance: ohVar,
    },
    production: {
      code: 'PRD',
      label: 'Production Variance',
      planned: round2(plannedTotal),
      actual: actualProduction,
      variance: prodVar,
    },
    totalVariance: round2(materialVar + laborVar + ohVar + prodVar),
  }
}

/** Evaluate closing gates against operational + finance read models. */
export function evaluateCostClosingGates(salesOrderId: string): CostClosingGate[] {
  const pos = queryAllProductionOrders().filter((p) => p.salesOrderId === salesOrderId)
  const openPos = pos.filter(
    (p) => !['Completed', 'Closed', 'Cancelled'].includes(p.status),
  )
  const completedPos =
    pos.length > 0 && pos.every((p) => p.status === 'Completed' || p.status === 'Closed')
  const fgReady =
    pos.length > 0 &&
    (pos.every((p) => p.finishedGoodsReady) ||
      queryAllStockMovements().some(
        (m) => m.type === 'PRODUCTION_OUTPUT' && pos.some((p) => m.referenceNo?.includes(p.productionOrderNo)),
      ) ||
      pos.every((p) => p.producedQty > 0 && (p.status === 'Completed' || p.status === 'Closed')))

  const shipments = queryAllShipments().filter((s) => s.salesOrderId === salesOrderId)
  const shipmentApplicable = shipments.length > 0
  const shipmentOk =
    !shipmentApplicable ||
    shipments.every((s) => s.status === 'Delivered' || s.status === 'Closed')

  const docs = queryAllExportDocumentSets().filter((d) => d.salesOrderId === salesOrderId)
  const docsApplicable = docs.length > 0
  const docsOk =
    !docsApplicable ||
    docs.every(
      (d) => d.status === 'Issued' && d.commercialInvoice.status === 'Issued',
    )

  const finance = queryAllAccountingIntegrations().filter(
    (b) =>
      b.sourceReferenceId === salesOrderId ||
      docs.some((d) => d.id === b.sourceReferenceId) ||
      shipments.some((s) => s.id === b.sourceReferenceId) ||
      pos.some((p) => p.id === b.sourceReferenceId),
  )
  const openFinance = finance.filter((b) => b.status === 'Queued' || b.status === 'Failed')
  const accountingOk =
    finance.length > 0 && openFinance.length === 0 && finance.every((b) => b.status === 'Posted' || b.status === 'Reversed')

  const producedQty = pos.reduce((s, p) => s + p.producedQty, 0)
  const shippedQty = shipments.reduce((s, sh) => s + sh.totals.totalQty, 0)
  const invOk =
    !shipmentApplicable
      ? producedQty > 0
      : producedQty > 0 && Math.abs(producedQty - shippedQty) / Math.max(producedQty, 1) <= 0.05

  const openGr = queryAllGoodsReceipts().filter((g) => g.status === 'Draft')

  return [
    {
      code: 'PRODUCTION_COMPLETED',
      passed: completedPos,
      applicable: true,
      detail: completedPos
        ? `${pos.length} production order(s) completed`
        : `Open/incomplete POs: ${openPos.map((p) => p.productionOrderNo).join(', ') || 'none'}`,
    },
    {
      code: 'FINISHED_GOODS_RECEIVED',
      passed: fgReady,
      applicable: true,
      detail: fgReady ? 'FG ready / PRODUCTION_OUTPUT present' : 'FG not received',
    },
    {
      code: 'SHIPMENT_COMPLETED',
      passed: shipmentOk,
      applicable: shipmentApplicable,
      detail: shipmentApplicable
        ? shipmentOk
          ? 'Shipments Delivered/Closed'
          : `Open shipments: ${shipments.map((s) => s.status).join(', ')}`
        : 'N/A — no shipments',
    },
    {
      code: 'COMMERCIAL_DOCS_ISSUED',
      passed: docsOk,
      applicable: docsApplicable,
      detail: docsApplicable
        ? docsOk
          ? 'Commercial docs Issued'
          : 'Docs not fully Issued'
        : 'N/A — no export docs',
    },
    {
      code: 'ACCOUNTING_POSTINGS_COMPLETED',
      passed: accountingOk,
      applicable: true,
      detail: accountingOk
        ? `${finance.length} Posted accounting batch(es)`
        : openFinance.length
          ? `${openFinance.length} open/failed postings`
          : 'No Posted accounting batches for scope',
    },
    {
      code: 'INVENTORY_RECONCILIATION',
      passed: invOk,
      applicable: true,
      detail: `produced=${producedQty} shipped=${shippedQty}`,
    },
    {
      code: 'NO_OPEN_PRODUCTION_ORDERS',
      passed: openPos.length === 0 && pos.length > 0,
      applicable: true,
      detail:
        openPos.length === 0
          ? pos.length
            ? 'No open production orders'
            : 'No production orders in scope'
          : `${openPos.length} open`,
    },
    {
      code: 'NO_OPEN_PURCHASE_RECEIPTS',
      passed: openGr.length === 0,
      applicable: true,
      detail: openGr.length === 0 ? 'No Draft GR' : `${openGr.length} Draft GR`,
    },
  ]
}

function buildRevaluation(salesOrderId: string, variances: CostVarianceBundle): InventoryRevaluation {
  const pos = queryAllProductionOrders().filter((p) => p.salesOrderId === salesOrderId)
  const qty = pos.reduce((s, p) => s + p.producedQty, 0)
  const unitBefore = qty > 0 ? round2(variances.production.planned / qty) : 0
  const unitAfter = qty > 0 ? round2(variances.production.actual / qty) : 0
  const amount = round2((unitAfter - unitBefore) * qty)
  return {
    stockCardId: null,
    quantity: qty,
    unitCostBefore: unitBefore,
    unitCostAfter: unitAfter,
    revaluationAmount: amount,
    passed: Math.abs(amount) < 1_000_000,
    detail: `Δ unit ${round2(unitAfter - unitBefore)} × ${qty}`,
  }
}

function buildFinancialReconciliation(salesOrderId: string): FinancialReconciliation {
  const finance = queryAllAccountingIntegrations().filter(
    (b) =>
      b.sourceReferenceId === salesOrderId ||
      b.status === 'Posted',
  )
  const scoped = queryAllAccountingIntegrations().filter((b) => {
    const docs = queryAllExportDocumentSets().filter((d) => d.salesOrderId === salesOrderId)
    const ships = queryAllShipments().filter((s) => s.salesOrderId === salesOrderId)
    const pos = queryAllProductionOrders().filter((p) => p.salesOrderId === salesOrderId)
    return (
      b.sourceReferenceId === salesOrderId ||
      docs.some((d) => d.id === b.sourceReferenceId) ||
      ships.some((s) => s.id === b.sourceReferenceId) ||
      pos.some((p) => p.id === b.sourceReferenceId)
    )
  })
  const debit = round2(scoped.reduce((s, b) => s + b.journalEntry.debitTotal, 0))
  const credit = round2(scoped.reduce((s, b) => s + b.journalEntry.creditTotal, 0))
  const openPostings = scoped.filter((b) => b.status === 'Queued' || b.status === 'Failed').length
  void finance
  return {
    debitTotal: debit,
    creditTotal: credit,
    balanced: Math.abs(debit - credit) <= 0.001,
    openPostings,
    detail: `${scoped.length} batches · open=${openPostings}`,
  }
}

function persist(
  entity: CostClosing,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): CostClosing {
  const now = new Date().toISOString()
  const persisted: PersistedCostClosing = {
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
    'CostClosing',
    saved.id,
    changeType === 'CreateCostClosing' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.batchNo} — ${changeType}` },
    null,
    {
      batchNo: saved.batchNo,
      status: saved.status,
      totalVariance: saved.variances?.totalVariance ?? null,
      anomalyScore: saved.anomalyScore,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-cc-${saved.id}-${Date.now()}`,
    entityType: 'COST_SHEET',
    entityId: saved.id,
    entityCode: saved.batchNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.salesOrderNo} · ${saved.status}`,
  })
  scheduleSalesOrderChange({
    salesOrderId: saved.salesOrderId,
    orderNo: saved.salesOrderNo,
    status: saved.status,
    productCardId: saved.productCardId,
    changeType,
    occurredAt: now,
    actorUserId,
  })
  return toDomain(saved)
}

function requireClosing(id: string): PersistedCostClosing {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new CostClosingDomainError(`Cost closing bulunamadı: ${id}`)
  return row
}

function resolvePeriod(code?: string): string {
  const periods = requireUnitOfWork().accountingIntegrations.listFinancialPeriods(DEFAULT_TENANT_ID)
  if (code) {
    const hit = periods.find((p) => p.code === code)
    if (!hit) throw new CostClosingDomainError(`Financial period yok: ${code}`)
    if (hit.status === 'Closed') {
      throw new CostClosingDomainError(`Closed financial period rejects cost closing: ${code}`)
    }
    return hit.code
  }
  const open = periods.find((p) => p.status === 'Open')
  return open?.code ?? '2026-08'
}

export function persistCreateCostClosing(
  input: CreateCostClosingInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const existing = repo().findBySalesOrderId(DEFAULT_TENANT_ID, input.salesOrderId)
  if (existing) return toDomain(existing)

  const order = querySalesOrderById(input.salesOrderId)
  if (!order) throw new CostClosingDomainError(`Sales order bulunamadı: ${input.salesOrderId}`)
  const product = queryAllProductCards().find((c) => c.id === order.productCardId)

  requireUnitOfWork().accountingIntegrations.ensureCatalogSeeded(DEFAULT_TENANT_ID)
  const period = resolvePeriod(input.financialPeriodCode)
  const n = repo().nextBatchCounter()
  const now = new Date().toISOString()
  const entity: CostClosing = {
    id: `cc-${n}`,
    batchNo: `CC-${String(n).padStart(6, '0')}`,
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    productCardId: order.productCardId,
    productCode: product?.productCode ?? order.productCardId,
    financialPeriodCode: period,
    status: 'Open',
    gates: [],
    variances: null,
    inventoryRevaluation: null,
    financialReconciliation: null,
    closingResult: null,
    approvalWorkflowId: null,
    approvalStatus: 'None',
    anomalyScore: 0,
    profitabilityHint: null,
    timeline: appendTimeline([], 'Open', actorUserId, 'Create', null),
    reverseOfId: null,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(entity, actorUserId, 'CreateCostClosing')
}

export function persistCalculateCostClosing(
  input: CostClosingTransitionInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  assertNotImmutable(current)
  if (current.status !== 'Open' && current.status !== 'Calculating') {
    throw new CostClosingDomainError(`Calculate yalnızca Open/Calculating: ${current.status}`)
  }

  const variances = buildVariances(current.productCardId, current.salesOrderId)
  const reval = buildRevaluation(current.salesOrderId, variances)
  const anomaly = computeAnomalyScore(variances.totalVariance, 0)

  return persist(
    {
      ...current,
      status: 'Calculating',
      variances,
      inventoryRevaluation: reval,
      anomalyScore: anomaly,
      profitabilityHint: computeProfitabilityHint(variances),
      timeline: appendTimeline(
        current.timeline,
        'Calculating',
        actorUserId,
        'Calculate',
        input.note ?? null,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'CalculateCostClosing',
    row.version,
  )
}

export function persistReconcileCostClosing(
  input: CostClosingTransitionInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  assertNotImmutable(current)
  if (current.status !== 'Calculating' && current.status !== 'Reconciling') {
    throw new CostClosingDomainError(`Reconcile için Calculating gerekli: ${current.status}`)
  }

  const gates = evaluateCostClosingGates(current.salesOrderId)
  const fin = buildFinancialReconciliation(current.salesOrderId)
  const failed = gates.filter((g) => g.applicable && !g.passed).length
  const anomaly = computeAnomalyScore(current.variances?.totalVariance ?? 0, failed)

  return persist(
    {
      ...current,
      status: 'Reconciling',
      gates,
      financialReconciliation: fin,
      anomalyScore: anomaly,
      profitabilityHint: computeProfitabilityHint(current.variances),
      timeline: appendTimeline(
        current.timeline,
        'Reconciling',
        actorUserId,
        'Reconcile',
        input.note ?? `${failed} gate fail`,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'ReconcileCostClosing',
    row.version,
  )
}

export function persistSubmitCostClosingApproval(
  input: CostClosingTransitionInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  assertNotImmutable(current)
  if (current.status !== 'Reconciling') {
    throw new CostClosingDomainError('Approval submit için Reconciling gerekli.')
  }

  const workflow = submitForApproval({
    workflowType: 'CostClosing',
    entityType: 'CostClosing',
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
        'Reconciling',
        actorUserId,
        'SubmitApproval',
        workflow.id,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'SubmitCostClosingApproval',
    row.version,
  )
}

export function persistApproveCostClosing(
  input: ApproveCostClosingInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  assertNotImmutable(current)
  if (!current.approvalWorkflowId) {
    throw new CostClosingDomainError('Approval workflow yok — önce submit.')
  }

  const wf = approveStep(current.approvalWorkflowId, actorUserId, input.comment)
  if (!wf) throw new CostClosingDomainError('Approval step başarısız.')

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
    'ApproveCostClosing',
    row.version,
  )
}

export function persistCloseCostClosing(
  input: CostClosingTransitionInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  if (current.status === 'Closed') return current
  assertNotImmutable(current)

  if (current.status !== 'Approved') {
    throw new CostClosingDomainError('Close için Approved gerekli.')
  }

  const gates = evaluateCostClosingGates(current.salesOrderId)
  const required = gates.filter((g) => g.applicable)
  for (const g of required) {
    if (!g.passed) {
      throw new CostClosingDomainError(`Close engellendi: ${g.code} — ${g.detail}`)
    }
  }

  const period = requireUnitOfWork()
    .accountingIntegrations.listFinancialPeriods(DEFAULT_TENANT_ID)
    .find((p) => p.code === current.financialPeriodCode)
  if (period?.status === 'Closed') {
    throw new CostClosingDomainError(
      `Closed financial period rejects postings/close: ${current.financialPeriodCode}`,
    )
  }

  const now = new Date().toISOString()
  return persist(
    {
      ...current,
      status: 'Closed',
      gates,
      closingResult: {
        closedAt: now,
        closedBy: actorUserId,
        totalVariance: current.variances?.totalVariance ?? 0,
        revaluationAmount: current.inventoryRevaluation?.revaluationAmount ?? 0,
        immutable: true,
      },
      timeline: appendTimeline(current.timeline, 'Closed', actorUserId, 'Close', input.note ?? null),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'CloseCostClosing',
    row.version,
  )
}

/** Reversible until Approved (Open / Calculating / Reconciling). */
export function persistReverseCostClosing(
  input: CostClosingTransitionInput,
  actorUserId: string,
): CostClosing {
  if (!input.idempotencyKey?.trim()) {
    throw new CostClosingDomainError('idempotencyKey zorunlu.')
  }
  const byKey = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (byKey) return toDomain(byKey)

  const row = requireClosing(input.costClosingId)
  const current = toDomain(row)
  if (current.status === 'Approved' || current.status === 'Closed') {
    throw new CostClosingDomainError('Reversible only until Approved.')
  }
  if (current.status === 'Reversed') return current

  return persist(
    {
      ...current,
      status: 'Reversed',
      timeline: appendTimeline(
        current.timeline,
        'Reversed',
        actorUserId,
        'Reverse',
        input.note ?? null,
      ),
      idempotencyKey: input.idempotencyKey,
    },
    actorUserId,
    'ReverseCostClosing',
    row.version,
  )
}
