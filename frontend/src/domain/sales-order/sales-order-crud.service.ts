/**
 * Sales Order CRUD — aggregate root write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import {
  isSalesOrderEditable,
  isSalesOrderReadOnly,
  isSalesOrderTransitionAllowed,
} from '@/domain/sales-order/sales-order-lifecycle.types'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedSalesOrder } from '@/domain/ports/persistence/persistence-aggregates'
import type { ISalesOrderRepository } from '@/domain/ports/persistence/aggregates/sales-order.repository'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { createRevision, getRevisions } from '@/domain/platform/services/versioning-service'
import {
  buildSalesOrderFromInput,
  normalizeSalesOrder,
  refreshSalesOrderMrp,
  type SalesOrderUpsertInput,
} from '@/domain/services/sales-order/sales-order-build.service'
import type {
  SalesOrder,
  SalesOrderLifecycleStatus,
  SalesOrderRevision,
} from '@/domain/types'

import { queryAllSalesOrders } from './sales-order-query.service'

export class SalesOrderDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SalesOrderDomainError'
  }
}

function salesOrderRepo(): ISalesOrderRepository {
  return requireUnitOfWork().salesOrders
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function stripOrder(row: PersistedSalesOrder): SalesOrder {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...order
  } = row
  return normalizeSalesOrder(order as SalesOrder)
}

function loadOrder(id: string): SalesOrder {
  const row = salesOrderRepo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new SalesOrderDomainError('Satış siparişi bulunamadı.')
  return stripOrder(row)
}

function orderVersion(id: string): number {
  return salesOrderRepo().version(DEFAULT_TENANT_ID, id)
}

function saveOrder(order: SalesOrder, expectedVersion?: number): SalesOrder {
  const existing = salesOrderRepo().findById(DEFAULT_TENANT_ID, order.id)
  const persisted: PersistedSalesOrder = {
    ...order,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  const saved = salesOrderRepo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion ?? existing?.version,
  })
  return stripOrder(saved)
}

function nextOrderId(): string {
  const all = queryAllSalesOrders()
  const max = all.reduce((m, o) => Math.max(m, Number.parseInt(o.id, 10) || 0), 0)
  return String(max + 1)
}

function nextOrderNo(): string {
  const all = queryAllSalesOrders()
  const max = all.reduce((m, o) => {
    const match = o.orderNo.match(/SIP-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 100)
  return `SIP-2026-${String(max + 1).padStart(4, '0')}`
}

function assertEditable(order: SalesOrder): void {
  if (isSalesOrderReadOnly(order.status)) {
    throw new SalesOrderDomainError(`Durum ${order.status} iken düzenleme yapılamaz.`)
  }
  if (!isSalesOrderEditable(order.status)) {
    throw new SalesOrderDomainError(`Durum ${order.status} iken düzenleme yapılamaz. Revizyon oluşturun.`)
  }
}

function assertVersion(id: string, expectedVersion: number): void {
  const current = orderVersion(id)
  if (current !== expectedVersion) {
    throw new SalesOrderDomainError(`Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${current}`)
  }
}

function appendTimeline(order: SalesOrder, actorUserId: string, action: string, reason: string): void {
  appendEnterpriseTimelineEntry({
    id: `tl-so-${order.id}-${Date.now()}`,
    entityType: 'SALES_ORDER',
    entityId: order.id,
    entityCode: order.orderNo,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

function auditOrder(
  order: SalesOrder,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  actorUserId: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  description?: string,
): void {
  logAudit('SalesOrder', order.id, action, { ...auditContext(actorUserId), description }, oldValue, newValue)
}

function publishOrder(order: SalesOrder, changeType: string, actorUserId: string): void {
  scheduleSalesOrderChange({
    salesOrderId: order.id,
    orderNo: order.orderNo,
    status: order.status,
    productCardId: order.productCardId,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

function transitionStatus(
  order: SalesOrder,
  to: SalesOrderLifecycleStatus,
  actorUserId: string,
  note: string,
): SalesOrder {
  if (!isSalesOrderTransitionAllowed(order.status, to)) {
    throw new SalesOrderDomainError(`Geçiş izni yok: ${order.status} → ${to}`)
  }
  const now = new Date().toISOString()
  const snapshot: SalesOrderRevision = {
    revisionNo: order.currentRevision.revisionNo,
    status: to,
    changedAt: now,
    changedById: actorUserId,
    changeNote: note,
  }
  return {
    ...order,
    status: to,
    currentRevision: snapshot,
    revisionHistory: [...order.revisionHistory, snapshot],
  }
}

export function persistCreateSalesOrder(input: SalesOrderUpsertInput, actorUserId: string): SalesOrder {
  const id = nextOrderId()
  const orderNo = nextOrderNo()
  let order = buildSalesOrderFromInput(id, orderNo, input, actorUserId)
  order = refreshSalesOrderMrp(order)
  const saved = saveOrder(order)
  auditOrder(saved, 'CREATE', actorUserId, null, { orderNo: saved.orderNo, status: saved.status })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_CREATE', 'Satış siparişi oluşturuldu')
  publishOrder(saved, 'created', actorUserId)
  return saved
}

export function persistUpdateSalesOrder(
  id: string,
  input: SalesOrderUpsertInput,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const existing = loadOrder(id)
  assertEditable(existing)

  const rebuilt = buildSalesOrderFromInput(id, existing.orderNo, input, actorUserId)
  let updated: SalesOrder = {
    ...existing,
    general: rebuilt.general,
    productCardId: rebuilt.productCardId,
    sizeSetId: rebuilt.sizeSetId,
    matrix: rebuilt.matrix,
    matrixTotals: rebuilt.matrixTotals,
    unitPrice: rebuilt.unitPrice,
    lineDeliveryDate: rebuilt.lineDeliveryDate,
    exfDate: rebuilt.exfDate,
    mrp: rebuilt.mrp,
    production: { ...existing.production, plannedQty: rebuilt.matrixTotals.grandTotal },
  }
  updated = refreshSalesOrderMrp(updated)

  const saved = saveOrder(updated, expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { orderNo: existing.orderNo }, { orderNo: saved.orderNo })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_UPDATE', 'Satış siparişi güncellendi')
  publishOrder(saved, 'updated', actorUserId)
  return saved
}

export function persistSubmitSalesOrderForReview(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const order = loadOrder(id)
  const updated = transitionStatus(order, 'Under Review', actorUserId, 'İncelemeye gönderildi')
  const saved = saveOrder(updated, expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: updated.status })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_SUBMITTED', 'İncelemeye gönderildi')
  publishOrder(saved, 'submitted', actorUserId)
  return saved
}

export function persistApproveSalesOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  comment?: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  let order = loadOrder(id)

  if (order.status === 'Draft') {
    order = saveOrder(transitionStatus(order, 'Under Review', actorUserId, 'İncelemeye gönderildi'), expectedVersion)
    expectedVersion = orderVersion(id)
    order = loadOrder(id)
  }

  if (order.status !== 'Under Review') {
    throw new SalesOrderDomainError(`Onay için sipariş Under Review olmalı. Mevcut: ${order.status}`)
  }

  let updated = transitionStatus(order, 'Approved', actorUserId, comment ?? 'Onaylandı')
  updated = refreshSalesOrderMrp(updated)
  const saved = saveOrder(updated, expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: updated.status }, comment)
  appendTimeline(saved, actorUserId, 'SALES_ORDER_APPROVED', comment ?? 'Onaylandı')
  publishOrder(saved, 'approved', actorUserId)
  return saved
}

export function persistActivateSalesOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  let order = loadOrder(id)
  if (order.status === 'Draft') {
    order = saveOrder(transitionStatus(order, 'Under Review', actorUserId, 'Aktivasyon öncesi'), expectedVersion)
    expectedVersion = orderVersion(id)
    order = loadOrder(id)
  }
  if (order.status === 'Under Review') {
    order = saveOrder(transitionStatus(order, 'Approved', actorUserId, 'Aktivasyon öncesi onay'), expectedVersion)
    expectedVersion = orderVersion(id)
    order = loadOrder(id)
  }
  const updated = transitionStatus(order, 'Active', actorUserId, 'Sipariş aktive edildi')
  const saved = saveOrder(
    { ...updated, productionStatus: 'Üretimde', production: { ...updated.production, bomReserved: true } },
    expectedVersion,
  )
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: 'Active' })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_ACTIVATED', 'Sipariş aktive edildi')
  publishOrder(saved, 'activated', actorUserId)
  return saved
}

export function persistCancelSalesOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  reason?: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const order = loadOrder(id)
  const updated = transitionStatus(order, 'Cancelled', actorUserId, reason ?? 'İptal edildi')
  const saved = saveOrder(updated, expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: 'Cancelled' }, reason)
  appendTimeline(saved, actorUserId, 'SALES_ORDER_CANCELLED', reason ?? 'İptal edildi')
  publishOrder(saved, 'cancelled', actorUserId)
  return saved
}

export function persistCloseSalesOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const order = loadOrder(id)
  const updated = transitionStatus(order, 'Closed', actorUserId, 'Kapatıldı')
  const saved = saveOrder(
    {
      ...updated,
      productionStatus: 'Tamamlandı',
      production: { ...updated.production, status: 'Tamamlandı' },
    },
    expectedVersion,
  )
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: 'Closed' })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_CLOSED', 'Sipariş kapatıldı')
  publishOrder(saved, 'closed', actorUserId)
  return saved
}

export function persistArchiveSalesOrder(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const order = loadOrder(id)
  const updated = transitionStatus(order, 'Archived', actorUserId, 'Arşivlendi')
  const saved = saveOrder(updated, expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { status: order.status }, { status: 'Archived' })
  appendTimeline(saved, actorUserId, 'SALES_ORDER_ARCHIVED', 'Arşivlendi')
  publishOrder(saved, 'archived', actorUserId)
  return saved
}

export function persistCreateSalesOrderRevision(
  id: string,
  reason: string,
  input: SalesOrderUpsertInput,
  expectedVersion: number,
  actorUserId: string,
): SalesOrder {
  assertVersion(id, expectedVersion)
  const existing = loadOrder(id)
  if (existing.status !== 'Active' && existing.status !== 'Approved' && existing.status !== 'Closed') {
    throw new SalesOrderDomainError('Revizyon yalnızca Active, Approved veya Closed siparişlerden oluşturulabilir.')
  }

  const nextRevisionNo = existing.currentRevision.revisionNo + 1
  createRevision({
    entityType: 'SalesOrder',
    entityKey: existing.id,
    payload: { orderNo: existing.orderNo, revisionNo: nextRevisionNo, reason },
    version: `R${nextRevisionNo}`,
    reasonOfChange: reason,
    createdBy: actorUserId,
    status: 'Draft',
  })

  const rebuilt = buildSalesOrderFromInput(existing.id, existing.orderNo, input, actorUserId)
  const revision = {
    revisionNo: nextRevisionNo,
    status: 'Draft' as SalesOrderLifecycleStatus,
    changedAt: new Date().toISOString(),
    changedById: actorUserId,
    changeNote: reason,
  }
  const updated: SalesOrder = {
    ...existing,
    ...rebuilt,
    status: 'Draft',
    currentRevision: revision,
    revisionHistory: [...existing.revisionHistory, revision],
  }
  const saved = saveOrder(refreshSalesOrderMrp(updated), expectedVersion)
  auditOrder(saved, 'UPDATE', actorUserId, { revisionNo: existing.currentRevision.revisionNo }, { revisionNo: nextRevisionNo }, reason)
  appendTimeline(saved, actorUserId, 'SALES_ORDER_REVISION', reason)
  publishOrder(saved, 'revision_created', actorUserId)
  return saved
}

export function querySalesOrderEntityRevisions(id: string) {
  return getRevisions('SalesOrder', id)
}
