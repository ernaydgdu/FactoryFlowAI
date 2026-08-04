/**
 * Purchase Order CRUD — lifecycle aggregate write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { supplierRepository } from '@/domain/master-data'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedPurchaseOrderAggregate } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseOrderRepository } from '@/domain/ports/persistence/aggregates/purchase-order.repository'
import { schedulePurchasingChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { createRevision } from '@/domain/platform/services/versioning-service'
import type {
  PurchaseOrderAggregate,
  PurchaseOrderLifecycleStatus,
  PurchaseOrderLine,
  PurchaseOrderRevision,
} from '@/domain/purchasing/purchasing.types'
import {
  isPurchaseOrderReadOnly,
  isPurchaseOrderTransitionAllowed,
} from '@/domain/purchasing/purchase-order-lifecycle.types'

import { queryPurchaseRequestById } from './purchase-request-query.service'
import { queryAllPurchaseOrders, queryPurchaseOrderVersion } from './purchase-order-query.service'
import { queryQuotationById } from './rfq-query.service'

export class PurchaseOrderDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseOrderDomainError'
  }
}

export type CreatePurchaseOrderInput = {
  purchaseRequestId: string
  quotationId?: string
  supplierCode: string
  termin: string
  deliveryWarehouse: string
  currency?: string
}

function poRepo(): IPurchaseOrderRepository {
  return requireUnitOfWork().purchaseOrders
}

function prRepo() {
  return requireUnitOfWork().purchaseRequests
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function strip(row: PersistedPurchaseOrderAggregate): PurchaseOrderAggregate {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...po
  } = row
  return po as PurchaseOrderAggregate
}

function loadPo(id: string): PurchaseOrderAggregate {
  const row = poRepo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new PurchaseOrderDomainError('Satın alma siparişi bulunamadı.')
  return strip(row)
}

function savePo(po: PurchaseOrderAggregate, expectedVersion?: number): PurchaseOrderAggregate {
  const existing = poRepo().findById(DEFAULT_TENANT_ID, po.id)
  const persisted: PersistedPurchaseOrderAggregate = {
    ...po,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? po.createdAt,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  return strip(poRepo().save(DEFAULT_TENANT_ID, persisted, { expectedVersion: expectedVersion ?? existing?.version }))
}

function nextPoId(): string {
  return String(queryAllPurchaseOrders().reduce((m, o) => Math.max(m, Number.parseInt(o.id, 10) || 0), 0) + 1)
}

function nextPoNo(): string {
  const max = queryAllPurchaseOrders().reduce((m, o) => {
    const match = o.poNo.match(/PO-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `PO-2026-${String(max + 1).padStart(4, '0')}`
}

function assertVersion(id: string, expectedVersion: number): void {
  const current = queryPurchaseOrderVersion(id)
  if (current !== expectedVersion) {
    throw new PurchaseOrderDomainError(`Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${current}`)
  }
}

function transitionStatus(
  po: PurchaseOrderAggregate,
  to: PurchaseOrderLifecycleStatus,
  actorUserId: string,
  note: string,
): PurchaseOrderAggregate {
  if (!isPurchaseOrderTransitionAllowed(po.status, to)) {
    throw new PurchaseOrderDomainError(`Geçiş izni yok: ${po.status} → ${to}`)
  }
  const now = new Date().toISOString()
  const snapshot: PurchaseOrderRevision = {
    revisionNo: po.currentRevision.revisionNo,
    status: to,
    changedAt: now,
    changedById: actorUserId,
    changeNote: note,
  }
  return {
    ...po,
    status: to,
    currentRevision: snapshot,
    revisionHistory: [...po.revisionHistory, snapshot],
  }
}

function emit(po: PurchaseOrderAggregate, changeType: string, actorUserId: string): void {
  schedulePurchasingChange({
    entityType: 'PurchaseOrder',
    entityId: po.id,
    entityNo: po.poNo,
    status: po.status,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

function appendTimeline(po: PurchaseOrderAggregate, actorUserId: string, action: string, reason: string): void {
  appendEnterpriseTimelineEntry({
    id: `tl-po-${po.id}-${Date.now()}`,
    entityType: 'PURCHASE_ORDER',
    entityId: po.id,
    entityCode: po.poNo,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

export function persistCreatePurchaseOrder(input: CreatePurchaseOrderInput, actorUserId: string): PurchaseOrderAggregate {
  const pr = queryPurchaseRequestById(input.purchaseRequestId)
  if (!pr) throw new PurchaseOrderDomainError('Satın alma talebi bulunamadı.')
  if (pr.status === 'Cancelled' || pr.status === 'PO Created') {
    throw new PurchaseOrderDomainError(`${pr.prNo} PO oluşturmaya uygun değil.`)
  }

  const supplier = supplierRepository.getByCode(input.supplierCode)
  let unitPrice = 0
  let rfqId: string | undefined
  let quotationId: string | undefined

  if (input.quotationId) {
    const quotation = queryQuotationById(input.quotationId)
    if (!quotation) throw new PurchaseOrderDomainError('Teklif bulunamadı.')
    if (quotation.status !== 'Selected' && quotation.status !== 'Pending') {
      throw new PurchaseOrderDomainError('Seçili teklif gerekli.')
    }
    const line = quotation.lines.find((l) => l.materialCode === pr.materialCode)
    unitPrice = line?.unitPrice ?? 0
    rfqId = quotation.rfqId
    quotationId = quotation.id
  }

  const now = new Date().toISOString()
  const qty = pr.quantity
  const line: PurchaseOrderLine = {
    id: `pol-${pr.id}`,
    materialCode: pr.materialCode,
    materialName: pr.materialName,
    quantity: qty,
    unit: pr.unit,
    unitPrice,
    vatRate: 20,
    deliveredQty: 0,
    remainingQty: qty,
  }
  const revision: PurchaseOrderRevision = {
    revisionNo: 1,
    status: 'Draft',
    changedAt: now,
    changedById: actorUserId,
    changeNote: 'PO oluşturuldu',
  }
  const po: PurchaseOrderAggregate = {
    id: nextPoId(),
    poNo: nextPoNo(),
    purchaseRequestId: pr.id,
    rfqId,
    quotationId,
    sourceOrderId: pr.sourceOrderId,
    sourceOrderNo: pr.sourceOrderNo,
    supplier: supplier?.name ?? input.supplierCode,
    supplierCode: input.supplierCode,
    termin: input.termin,
    deliveryWarehouse: input.deliveryWarehouse,
    currency: input.currency ?? 'USD',
    lines: [line],
    totalAmount: Math.round(qty * unitPrice * 100) / 100,
    status: 'Draft',
    currentRevision: revision,
    revisionHistory: [revision],
    createdAt: now,
    createdBy: actorUserId,
  }

  const saved = savePo(po)
  const prRow = prRepo().findById(DEFAULT_TENANT_ID, pr.id)
  if (prRow) {
    prRepo().save(DEFAULT_TENANT_ID, {
      ...prRow,
      status: 'PO Created',
      updatedAt: now,
    })
  }

  logAudit(
    'PurchaseOrder',
    saved.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `PO oluşturuldu: ${saved.poNo}` },
    null,
    { poNo: saved.poNo, prNo: pr.prNo },
  )
  appendTimeline(saved, actorUserId, 'PO_CREATE', `${pr.prNo} → ${saved.poNo}`)
  emit(saved, 'Create', actorUserId)
  return saved
}

export function persistSubmitPurchaseOrderForReview(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  const po = loadPo(id)
  const updated = transitionStatus(po, 'Under Review', actorUserId, 'İncelemeye gönderildi')
  const saved = savePo(updated, expectedVersion)
  logAudit('PurchaseOrder', id, 'UPDATE', auditContext(actorUserId), { status: po.status }, { status: 'Under Review' })
  appendTimeline(saved, actorUserId, 'PO_SUBMIT', 'İncelemeye gönderildi')
  emit(saved, 'Submit', actorUserId)
  return saved
}

export function persistApprovePurchaseOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  comment?: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  let po = loadPo(id)

  if (po.status === 'Draft') {
    po = savePo(transitionStatus(po, 'Under Review', actorUserId, 'Onay öncesi inceleme'), expectedVersion)
    expectedVersion = queryPurchaseOrderVersion(id)
    po = loadPo(id)
  }

  if (po.status !== 'Under Review') {
    throw new PurchaseOrderDomainError(`Onay için PO Under Review olmalı. Mevcut: ${po.status}`)
  }

  let updated = transitionStatus(po, 'Approved', actorUserId, comment ?? 'Onaylandı')
  updated = {
    ...updated,
    approvedBy: actorUserId,
    approvedAt: new Date().toISOString(),
  }
  updated = transitionStatus(updated, 'Open', actorUserId, 'Tedarikçiye açıldı')
  const saved = savePo(updated, expectedVersion)
  logAudit(
    'PurchaseOrder',
    id,
    'APPROVE',
    { ...auditContext(actorUserId), description: comment },
    { status: po.status },
    { status: 'Open' },
  )
  appendTimeline(saved, actorUserId, 'PO_APPROVE', comment ?? 'Onaylandı ve açıldı')
  emit(saved, 'Approve', actorUserId)
  return saved
}

export function persistClosePurchaseOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  let po = loadPo(id)
  if (po.status === 'Open' || po.status === 'Partially Received') {
    po = savePo(transitionStatus(po, 'Completed', actorUserId, 'Tamamlandı'), expectedVersion)
    expectedVersion = queryPurchaseOrderVersion(id)
    po = loadPo(id)
  }
  const updated = transitionStatus(po, 'Closed', actorUserId, 'Kapatıldı')
  const saved = savePo(updated, expectedVersion)
  logAudit('PurchaseOrder', id, 'UPDATE', auditContext(actorUserId), { status: po.status }, { status: 'Closed' })
  appendTimeline(saved, actorUserId, 'PO_CLOSE', 'PO kapatıldı')
  emit(saved, 'Close', actorUserId)
  return saved
}

export function persistCancelPurchaseOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  reason?: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  const po = loadPo(id)
  if (isPurchaseOrderReadOnly(po.status)) {
    throw new PurchaseOrderDomainError(`${po.status} durumunda iptal edilemez.`)
  }
  const updated = transitionStatus(po, 'Cancelled', actorUserId, reason ?? 'İptal edildi')
  const saved = savePo(updated, expectedVersion)
  logAudit('PurchaseOrder', id, 'UPDATE', auditContext(actorUserId), { status: po.status }, { status: 'Cancelled' })
  appendTimeline(saved, actorUserId, 'PO_CANCEL', reason ?? 'İptal edildi')
  emit(saved, 'Cancel', actorUserId)
  return saved
}

export function persistArchivePurchaseOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  const po = loadPo(id)
  if (po.status !== 'Closed' && po.status !== 'Cancelled') {
    throw new PurchaseOrderDomainError('Arşivleme yalnızca Closed veya Cancelled PO için geçerlidir.')
  }
  const updated = transitionStatus(po, 'Archived', actorUserId, 'Arşivlendi')
  const saved = savePo(updated, expectedVersion)
  logAudit('PurchaseOrder', id, 'UPDATE', auditContext(actorUserId), { status: po.status }, { status: 'Archived' })
  appendTimeline(saved, actorUserId, 'PO_ARCHIVE', 'Arşivlendi')
  emit(saved, 'Archive', actorUserId)
  return saved
}

export function persistCreatePurchaseOrderRevision(
  id: string,
  reason: string,
  expectedVersion: number,
  actorUserId: string,
): PurchaseOrderAggregate {
  assertVersion(id, expectedVersion)
  const existing = loadPo(id)
  if (existing.status !== 'Open' && existing.status !== 'Approved' && existing.status !== 'Closed') {
    throw new PurchaseOrderDomainError('Revizyon yalnızca Open, Approved veya Closed PO için oluşturulabilir.')
  }

  const nextRevisionNo = existing.currentRevision.revisionNo + 1
  createRevision({
    entityType: 'PurchaseOrder',
    entityKey: existing.id,
    payload: { poNo: existing.poNo, revisionNo: nextRevisionNo, reason },
    version: `R${nextRevisionNo}`,
    reasonOfChange: reason,
    createdBy: actorUserId,
    status: 'Draft',
  })

  const now = new Date().toISOString()
  const revision: PurchaseOrderRevision = {
    revisionNo: nextRevisionNo,
    status: 'Draft',
    changedAt: now,
    changedById: actorUserId,
    changeNote: reason,
  }
  const updated: PurchaseOrderAggregate = {
    ...existing,
    status: 'Draft',
    currentRevision: revision,
    revisionHistory: [...existing.revisionHistory, revision],
  }
  const saved = savePo(updated, expectedVersion)
  logAudit(
    'PurchaseOrder',
    id,
    'UPDATE',
    { ...auditContext(actorUserId), description: reason },
    { revisionNo: existing.currentRevision.revisionNo },
    { revisionNo: nextRevisionNo },
  )
  appendTimeline(saved, actorUserId, 'PO_REVISION', reason)
  emit(saved, 'Revision', actorUserId)
  return saved
}

export function applyGoodsReceiptToPurchaseOrder(
  purchaseOrderId: string,
  lines: { materialCode: string; quantity: number }[],
  actorUserId: string,
): PurchaseOrderAggregate {
  const po = loadPo(purchaseOrderId)
  if (po.status !== 'Open' && po.status !== 'Partially Received' && po.status !== 'Approved') {
    throw new PurchaseOrderDomainError('Mal kabul yalnızca açık PO için yapılabilir.')
  }

  const updatedLines = po.lines.map((line) => {
    const received = lines.find((l) => l.materialCode === line.materialCode)
    if (!received) return line
    const deliveredQty = Math.min(line.quantity, line.deliveredQty + received.quantity)
    return {
      ...line,
      deliveredQty,
      remainingQty: Math.max(0, line.quantity - deliveredQty),
    }
  })

  const allDelivered = updatedLines.every((l) => l.remainingQty === 0)
  const anyDelivered = updatedLines.some((l) => l.deliveredQty > 0)
  let status: PurchaseOrderLifecycleStatus = po.status
  if (allDelivered) status = 'Completed'
  else if (anyDelivered) status = 'Partially Received'

  const now = new Date().toISOString()
  const snapshot: PurchaseOrderRevision = {
    revisionNo: po.currentRevision.revisionNo,
    status,
    changedAt: now,
    changedById: actorUserId,
    changeNote: 'Mal kabul güncellendi',
  }

  const saved = savePo({
    ...po,
    lines: updatedLines,
    status,
    currentRevision: snapshot,
    revisionHistory: [...po.revisionHistory, snapshot],
  })

  emit(saved, 'GoodsReceipt', actorUserId)
  return saved
}
