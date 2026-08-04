/**
 * MRP Run CRUD — aggregate root write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { isMrpReadOnly, isMrpTransitionAllowed } from '@/domain/mrp/mrp-lifecycle.types'
import { calculateMrpSnapshot } from '@/domain/mrp/mrp-engine.service'
import { freezeMrpSnapshot } from '@/domain/mrp/mrp-snapshot.service'
import type { MrpRun, MrpSnapshot } from '@/domain/mrp/mrp.types'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedMrpRun } from '@/domain/ports/persistence/persistence-aggregates'
import type { IMrpRunRepository } from '@/domain/ports/persistence/aggregates/mrp-run.repository'
import { scheduleMrpChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { createRevision } from '@/domain/platform/services/versioning-service'
import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { createProductionOrderFromSalesOrder } from '@/domain/production-order/lifecycle-service'
import { persistCreatePurchaseRequestFromMrpProposal } from '@/domain/purchasing/purchase-request-crud.service'
import { querySalesOrderById, queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { toLegacyBomLines } from '@/domain/services/textile/bom-service'
import { queryAllStockCards } from '@/domain/stock-card/stock-card-query.service'

import { queryAllMrpRuns, queryLatestMrpRun } from './mrp-query.service'

export class MrpDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MrpDomainError'
  }
}

function mrpRunRepo(): IMrpRunRepository {
  return requireUnitOfWork().mrpRuns
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function stripRun(row: PersistedMrpRun): MrpRun {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...run
  } = row
  return run as MrpRun
}

function loadRun(id: string): MrpRun {
  const row = mrpRunRepo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new MrpDomainError('MRP çalıştırması bulunamadı.')
  return stripRun(row)
}

function runVersion(id: string): number {
  return mrpRunRepo().version(DEFAULT_TENANT_ID, id)
}

function saveRun(run: MrpRun, expectedVersion?: number): MrpRun {
  const existing = mrpRunRepo().findById(DEFAULT_TENANT_ID, run.id)
  const persisted: PersistedMrpRun = {
    ...run,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  const saved = mrpRunRepo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion ?? existing?.version,
  })
  return stripRun(saved)
}

function nextRunId(): string {
  const all = queryAllMrpRuns()
  const max = all.reduce((m, r) => Math.max(m, Number.parseInt(r.id, 10) || 0), 0)
  return String(max + 1)
}

function nextRunNo(): string {
  const all = queryAllMrpRuns()
  const max = all.reduce((m, r) => {
    const match = r.runNo.match(/MRP-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `MRP-2026-${String(max + 1).padStart(4, '0')}`
}

function assertVersion(id: string, expectedVersion: number): void {
  const current = runVersion(id)
  if (current !== expectedVersion) {
    throw new MrpDomainError(`Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${current}`)
  }
}

function appendTimeline(run: MrpRun, actorUserId: string, action: string, reason: string): void {
  appendEnterpriseTimelineEntry({
    id: `tl-mrp-${run.id}-${Date.now()}`,
    entityType: 'MRP_RUN',
    entityId: run.id,
    entityCode: run.runNo,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

function appendSnapshotRevision(run: MrpRun, snapshot: MrpSnapshot, actorUserId: string, reason: string): void {
  createRevision({
    entityType: 'MrpRun',
    entityKey: run.runNo,
    payload: snapshot as unknown as Record<string, unknown>,
    version: String(snapshot.revisionNo),
    createdBy: actorUserId,
    reasonOfChange: reason,
    status: 'Active',
  })
}

function emitOutbox(run: MrpRun, changeType: string, actorUserId: string): void {
  scheduleMrpChange({
    mrpRunId: run.id,
    runNo: run.runNo,
    status: run.status,
    revisionNo: run.currentSnapshot.revisionNo,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

export function persistRunMrp(actorUserId: string): MrpRun {
  const snapshot = freezeMrpSnapshot(calculateMrpSnapshot(1))
  const now = new Date().toISOString()
  const run: MrpRun = {
    id: nextRunId(),
    runNo: nextRunNo(),
    status: 'Calculated',
    currentSnapshot: snapshot,
    snapshotHistory: [],
    createdAt: now,
    updatedAt: now,
    createdBy: actorUserId,
  }

  const saved = saveRun(run)
  appendSnapshotRevision(saved, snapshot, actorUserId, 'İlk MRP hesaplaması')
  logAudit(
    'MrpRun',
    saved.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `MRP çalıştırması oluşturuldu: ${saved.runNo}` },
    null,
    { runNo: saved.runNo, status: saved.status, lineCount: snapshot.lines.length },
  )
  appendTimeline(saved, actorUserId, 'MRP_RUN', `${snapshot.lines.length} malzeme satırı hesaplandı`)
  emitOutbox(saved, 'Run', actorUserId)
  return saved
}

export function persistRegenerateMrp(mrpRunId: string, expectedVersion: number, actorUserId: string): MrpRun {
  const run = loadRun(mrpRunId)
  assertVersion(mrpRunId, expectedVersion)
  if (isMrpReadOnly(run.status)) {
    throw new MrpDomainError('Arşivlenmiş MRP yeniden hesaplanamaz.')
  }

  const nextRevision = run.currentSnapshot.revisionNo + 1
  const snapshot = freezeMrpSnapshot(calculateMrpSnapshot(nextRevision))
  const history = [...run.snapshotHistory.map(freezeMrpSnapshot), freezeMrpSnapshot(run.currentSnapshot)]
  const updated: MrpRun = {
    ...run,
    status: 'Calculated',
    currentSnapshot: snapshot,
    snapshotHistory: history,
    updatedAt: new Date().toISOString(),
  }

  const saved = saveRun(updated, expectedVersion)
  appendSnapshotRevision(saved, snapshot, actorUserId, `Revizyon ${nextRevision} yeniden hesaplama`)
  logAudit(
    'MrpRun',
    saved.id,
    'UPDATE',
    { ...auditContext(actorUserId), description: `MRP yeniden hesaplandı: ${saved.runNo} rev ${nextRevision}` },
    { revisionNo: run.currentSnapshot.revisionNo },
    { revisionNo: nextRevision, lineCount: snapshot.lines.length },
  )
  appendTimeline(saved, actorUserId, 'MRP_REGENERATE', `Revizyon ${nextRevision}`)
  emitOutbox(saved, 'Regenerate', actorUserId)
  return saved
}

export function persistApproveMrp(mrpRunId: string, expectedVersion: number, actorUserId: string): MrpRun {
  const run = loadRun(mrpRunId)
  assertVersion(mrpRunId, expectedVersion)
  if (!isMrpTransitionAllowed(run.status, 'Approved')) {
    throw new MrpDomainError(`Durum ${run.status} iken onaylanamaz.`)
  }

  const updated: MrpRun = {
    ...run,
    status: 'Approved',
    approvedBy: actorUserId,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const saved = saveRun(updated, expectedVersion)
  logAudit(
    'MrpRun',
    saved.id,
    'APPROVE',
    { ...auditContext(actorUserId), description: `MRP onaylandı: ${saved.runNo}` },
    { status: run.status },
    { status: 'Approved' },
  )
  appendTimeline(saved, actorUserId, 'MRP_APPROVE', 'Plan onaylandı')
  emitOutbox(saved, 'Approve', actorUserId)
  return saved
}

export function persistReleasePurchaseSuggestions(
  mrpRunId: string,
  expectedVersion: number,
  actorUserId: string,
  suggestionIds?: string[],
): MrpRun {
  const run = loadRun(mrpRunId)
  assertVersion(mrpRunId, expectedVersion)
  if (run.status !== 'Approved' && run.status !== 'Released') {
    throw new MrpDomainError('Satın alma önerileri yalnızca onaylı MRP için serbest bırakılabilir.')
  }

  const pending = run.currentSnapshot.purchaseSuggestions.filter(
    (s) => s.status === 'Pending' && (!suggestionIds?.length || suggestionIds.includes(s.id)),
  )
  if (pending.length === 0) {
    throw new MrpDomainError('Serbest bırakılacak satın alma önerisi yok.')
  }

  const sourceOrder = queryAllMrpRuns().length > 0
    ? queryAllSalesOrders().find((o) => o.status !== 'Cancelled' && o.status !== 'Archived')
    : null

  for (const suggestion of pending) {
    const orderId = sourceOrder?.id ?? run.id
    const orderNo = sourceOrder?.orderNo ?? run.runNo
    persistCreatePurchaseRequestFromMrpProposal(
      run.id,
      suggestion,
      orderId,
      orderNo,
      actorUserId,
    )
  }

  const updatedSuggestions = run.currentSnapshot.purchaseSuggestions.map((s) =>
    pending.some((p) => p.id === s.id) ? { ...s, status: 'Released' as const } : s,
  )
  const updatedSnapshot = freezeMrpSnapshot({
    ...run.currentSnapshot,
    purchaseSuggestions: updatedSuggestions,
  })
  const updated: MrpRun = {
    ...run,
    status: 'Released',
    currentSnapshot: updatedSnapshot,
    updatedAt: new Date().toISOString(),
  }
  const saved = saveRun(updated, expectedVersion)
  logAudit(
    'MrpRun',
    saved.id,
    'UPDATE',
    { ...auditContext(actorUserId), description: `${pending.length} satın alma önerisi SAT olarak serbest bırakıldı` },
    { releasedPurchaseCount: 0 },
    { releasedPurchaseCount: pending.length },
  )
  appendTimeline(saved, actorUserId, 'MRP_RELEASE_PURCHASE', `${pending.length} SAT oluşturuldu`)
  emitOutbox(saved, 'ReleasePurchase', actorUserId)
  return saved
}

export function persistReleaseProductionSuggestions(
  mrpRunId: string,
  expectedVersion: number,
  actorUserId: string,
  suggestionIds?: string[],
): MrpRun {
  const run = loadRun(mrpRunId)
  assertVersion(mrpRunId, expectedVersion)
  if (run.status !== 'Approved' && run.status !== 'Released') {
    throw new MrpDomainError('Üretim önerileri yalnızca onaylı MRP için serbest bırakılabilir.')
  }

  const pending = run.currentSnapshot.productionSuggestions.filter(
    (s) => s.status === 'Pending' && (!suggestionIds?.length || suggestionIds.includes(s.id)),
  )
  if (pending.length === 0) {
    throw new MrpDomainError('Serbest bırakılacak üretim önerisi yok.')
  }

  const stockMap = new Map(queryAllStockCards().map((s) => [s.id, s]))
  for (const suggestion of pending) {
    const order = querySalesOrderById(suggestion.salesOrderId)
    if (!order) continue
    const product = queryProductCardById(suggestion.productCardId)
    if (!product) continue
    try {
      createProductionOrderFromSalesOrder(
        {
          salesOrder: {
            id: order.id,
            orderNo: order.orderNo,
            productCardId: order.productCardId,
            general: order.general,
            matrix: order.matrix,
            matrixTotals: order.matrixTotals,
            production: order.production,
            exfDate: order.exfDate,
            terminRisk: order.terminRisk,
          },
          product: {
            id: product.id,
            productCode: product.productCode,
            productName: product.productName,
            buyer: product.resolved.buyer,
            bom: toLegacyBomLines(product.bom),
          },
          stockCardsById: new Map(
            [...stockMap.entries()].map(([id, s]) => [
              id,
              { id: s.id, code: s.code, name: s.name, unit: s.unit, warehouseCode: s.warehouseCode },
            ]),
          ),
        },
        actorUserId,
      )
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes('UE zaten var')) {
        throw err
      }
    }
  }

  const updatedSuggestions = run.currentSnapshot.productionSuggestions.map((s) =>
    pending.some((p) => p.id === s.id) ? { ...s, status: 'Released' as const } : s,
  )
  const updatedSnapshot = freezeMrpSnapshot({
    ...run.currentSnapshot,
    productionSuggestions: updatedSuggestions,
  })
  const updated: MrpRun = {
    ...run,
    status: 'Released',
    currentSnapshot: updatedSnapshot,
    updatedAt: new Date().toISOString(),
  }
  const saved = saveRun(updated, expectedVersion)
  logAudit(
    'MrpRun',
    saved.id,
    'UPDATE',
    { ...auditContext(actorUserId), description: `${pending.length} üretim önerisi serbest bırakıldı` },
    { releasedProductionCount: 0 },
    { releasedProductionCount: pending.length },
  )
  appendTimeline(saved, actorUserId, 'MRP_RELEASE_PRODUCTION', `${pending.length} UE oluşturuldu`)
  emitOutbox(saved, 'ReleaseProduction', actorUserId)
  return saved
}

export function getOrCreateLatestMrpRun(actorUserId: string): MrpRun {
  const latest = queryLatestMrpRun()
  if (latest) return latest
  return persistRunMrp(actorUserId)
}
