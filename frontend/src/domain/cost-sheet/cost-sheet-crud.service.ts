/**
 * Cost Sheet CRUD — Product Card aggregate child entity write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import {
  isCostSheetEditable,
  isCostSheetReadOnly,
  isCostSheetTransitionAllowed,
} from '@/domain/cost-sheet/cost-sheet-lifecycle.types'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedProductCard } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductCardRepository } from '@/domain/ports/persistence/aggregates/product-card.repository'
import { scheduleCostSheetChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import {
  activateRevision,
  createRevision,
  getRevisions,
} from '@/domain/platform/services/versioning-service'
import { normalizeBillOfMaterials } from '@/domain/services/textile/bom-service'
import {
  buildPlannedCostSheet,
  enrichCostSheetLines,
  normalizePlannedCostSheet,
  recalculatePlannedCostFromBom,
  validateCostSheet,
  type CostSheetLineInput,
} from '@/domain/services/textile/cost-sheet-service'
import type {
  CostSheetLifecycleStatus,
  CostSheetRevisionSnapshot,
  PlannedCostSheet,
  TextileProductCard,
} from '@/domain/types/textile-erp'

export class CostSheetDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CostSheetDomainError'
  }
}

function productCardRepo(): IProductCardRepository {
  return requireUnitOfWork().productCards
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function stripCard(row: PersistedProductCard): TextileProductCard {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...card
  } = row
  return card as TextileProductCard
}

function loadCard(productCardId: string): TextileProductCard {
  const row = productCardRepo().findById(DEFAULT_TENANT_ID, productCardId)
  if (!row) throw new CostSheetDomainError('Ürün kartı bulunamadı.')
  const card = stripCard(row)
  const bom = normalizeBillOfMaterials(card.bom)
  const costSheet = normalizePlannedCostSheet(card.costSheet, productCardId, bom)
  return { ...card, bom, costSheet }
}

function cardVersion(productCardId: string): number {
  return productCardRepo().version(DEFAULT_TENANT_ID, productCardId)
}

function saveCard(card: TextileProductCard, expectedVersion: number): TextileProductCard {
  const existing = productCardRepo().findById(DEFAULT_TENANT_ID, card.id)
  const persisted: PersistedProductCard = {
    ...card,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  const saved = productCardRepo().save(DEFAULT_TENANT_ID, persisted, { expectedVersion })
  return stripCard(saved)
}

function assertCostSheetEditable(costSheet: PlannedCostSheet): void {
  if (isCostSheetReadOnly(costSheet.status)) {
    throw new CostSheetDomainError('Arşivlenmiş maliyet çizelgesi düzenlenemez.')
  }
  if (!isCostSheetEditable(costSheet.status)) {
    throw new CostSheetDomainError(
      `Maliyet çizelgesi durumu ${costSheet.status} iken düzenleme yapılamaz. Revizyon oluşturun.`,
    )
  }
}

function assertVersion(productCardId: string, expectedVersion: number): void {
  const current = cardVersion(productCardId)
  if (current !== expectedVersion) {
    throw new CostSheetDomainError(`Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${current}`)
  }
}

function appendTimeline(card: TextileProductCard, actorUserId: string, action: string, reason: string): void {
  appendEnterpriseTimelineEntry({
    id: `tl-cost-${card.id}-${Date.now()}`,
    entityType: 'PRODUCT_CARD',
    entityId: card.id,
    entityCode: card.productCode,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

function auditCostSheet(
  card: TextileProductCard,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  actorUserId: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  description?: string,
): void {
  logAudit(
    'CostSheet',
    card.costSheet.id,
    action,
    { ...auditContext(actorUserId), description },
    oldValue,
    newValue,
  )
}

function publishCostSheet(card: TextileProductCard, changeType: string, actorUserId: string): void {
  scheduleCostSheetChange({
    productCardId: card.id,
    costSheetId: card.costSheet.id,
    revisionNo: card.costSheet.revisionNo,
    status: card.costSheet.status,
    totalPlannedCost: card.costSheet.totalPlannedCost,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

function transitionCostSheetStatus(
  costSheet: PlannedCostSheet,
  to: CostSheetLifecycleStatus,
  actorUserId: string,
  note: string,
): PlannedCostSheet {
  if (!isCostSheetTransitionAllowed(costSheet.status, to)) {
    throw new CostSheetDomainError(`Maliyet geçişi izni yok: ${costSheet.status} → ${to}`)
  }
  const now = new Date().toISOString()
  const snapshot: CostSheetRevisionSnapshot = {
    revisionNo: costSheet.revisionNo,
    status: to,
    changedAt: now,
    changedById: actorUserId,
    changeNote: note,
    totalPlannedCost: costSheet.totalPlannedCost,
    entityRevisionId: costSheet.activeRevisionRecordId,
  }
  return {
    ...costSheet,
    status: to,
    generatedAt: now,
    revisionHistory: [...costSheet.revisionHistory, snapshot],
  }
}

/** BOM değişikliğinde planlanan maliyeti yeniden hesapla */
export function syncCostSheetAfterBomChange(card: TextileProductCard): TextileProductCard {
  const costSheet = normalizePlannedCostSheet(card.costSheet, card.id, card.bom)
  if (!isCostSheetEditable(costSheet.status)) return { ...card, costSheet }
  const recalculated = recalculatePlannedCostFromBom(costSheet, card.bom)
  return { ...card, costSheet: recalculated }
}

export function queryCostSheetByProductId(productCardId: string): PlannedCostSheet | null {
  const card = loadCard(productCardId)
  return card.costSheet
}

export function queryCostSheetVersion(productCardId: string): number {
  return cardVersion(productCardId)
}

export function queryCostSheetEntityRevisions(productCardId: string) {
  const card = loadCard(productCardId)
  return getRevisions('CostSheet', card.costSheet.id)
}

export function persistCreateCostSheet(
  productCardId: string,
  lines: CostSheetLineInput[],
  expectedVersion: number,
  actorUserId: string,
  quantityBasis = 1,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  if (card.costSheet?.totalPlannedCost > 0 && card.costSheet.status !== 'Archived') {
    throw new CostSheetDomainError('Maliyet çizelgesi zaten mevcut. Güncelleme veya revizyon kullanın.')
  }

  const costSheet = buildPlannedCostSheet(
    productCardId,
    card.bom,
    1,
    'Draft',
    actorUserId,
    'Maliyet çizelgesi oluşturuldu',
    lines,
    quantityBasis,
  )
  const validation = validateCostSheet(costSheet)
  if (!validation.valid) throw new CostSheetDomainError(validation.errors.join(', '))

  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(saved, 'CREATE', actorUserId, null, { totalPlannedCost: costSheet.totalPlannedCost })
  appendTimeline(saved, actorUserId, 'COST_SHEET_CREATE', 'Maliyet çizelgesi oluşturuldu')
  publishCostSheet(saved, 'created', actorUserId)
  return saved.costSheet
}

export function persistUpdateCostSheet(
  productCardId: string,
  lines: CostSheetLineInput[],
  expectedVersion: number,
  actorUserId: string,
  quantityBasis?: number,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  assertCostSheetEditable(card.costSheet)

  const updatedCostSheet = enrichCostSheetLines(card.costSheet, card.bom, lines, quantityBasis)
  const validation = validateCostSheet(updatedCostSheet)
  if (!validation.valid) throw new CostSheetDomainError(validation.errors.join(', '))

  const oldTotal = card.costSheet.totalPlannedCost
  const saved = saveCard({ ...card, costSheet: updatedCostSheet }, expectedVersion)
  auditCostSheet(
    saved,
    'UPDATE',
    actorUserId,
    { totalPlannedCost: oldTotal },
    { totalPlannedCost: saved.costSheet.totalPlannedCost },
  )
  appendTimeline(saved, actorUserId, 'COST_SHEET_UPDATE', 'Maliyet çizelgesi güncellendi')
  publishCostSheet(saved, 'updated', actorUserId)
  return saved.costSheet
}

export function persistSubmitCostSheetForReview(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  const validation = validateCostSheet(card.costSheet)
  if (!validation.valid) throw new CostSheetDomainError(validation.errors.join(', '))

  const costSheet = transitionCostSheetStatus(card.costSheet, 'Under Review', actorUserId, 'İncelemeye gönderildi')
  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(saved, 'UPDATE', actorUserId, { status: card.costSheet.status }, { status: costSheet.status })
  appendTimeline(saved, actorUserId, 'COST_SHEET_SUBMITTED', 'Maliyet çizelgesi incelemeye gönderildi')
  publishCostSheet(saved, 'submitted', actorUserId)
  return saved.costSheet
}

export function persistApproveCostSheet(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
  comment?: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  let card = loadCard(productCardId)

  if (card.costSheet.status === 'Draft') {
    const submitted = transitionCostSheetStatus(
      card.costSheet,
      'Under Review',
      actorUserId,
      'İncelemeye gönderildi',
    )
    card = saveCard({ ...card, costSheet: submitted }, expectedVersion)
    expectedVersion = cardVersion(productCardId)
    card = loadCard(productCardId)
  }

  if (card.costSheet.status !== 'Under Review') {
    throw new CostSheetDomainError(`Onay için maliyet çizelgesi Under Review olmalı. Mevcut: ${card.costSheet.status}`)
  }

  const costSheet = transitionCostSheetStatus(card.costSheet, 'Approved', actorUserId, comment ?? 'Onaylandı')
  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(
    saved,
    'UPDATE',
    actorUserId,
    { status: card.costSheet.status },
    { status: costSheet.status },
    comment,
  )
  appendTimeline(saved, actorUserId, 'COST_SHEET_APPROVED', comment ?? 'Maliyet çizelgesi onaylandı')
  publishCostSheet(saved, 'approved', actorUserId)
  return saved.costSheet
}

export function persistCreateCostSheetRevision(
  productCardId: string,
  reason: string,
  lines: CostSheetLineInput[],
  expectedVersion: number,
  actorUserId: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  if (
    card.costSheet.status !== 'Active' &&
    card.costSheet.status !== 'Approved' &&
    card.costSheet.status !== 'Archived'
  ) {
    throw new CostSheetDomainError(
      'Revizyon yalnızca Active, Approved veya Archived maliyet çizelgesinden oluşturulabilir.',
    )
  }

  const nextRevisionNo = card.costSheet.revisionNo + 1
  const payload = {
    lines: lines.map((l) => ({ key: l.key, amount: l.amount, notes: l.notes })),
    revisionNo: nextRevisionNo,
    totalPlannedCost: card.costSheet.totalPlannedCost,
  }

  const revisionRecord = createRevision({
    entityType: 'CostSheet',
    entityKey: card.costSheet.id,
    payload,
    version: `R${nextRevisionNo}`,
    reasonOfChange: reason,
    createdBy: actorUserId,
    status: 'Draft',
  })

  const costSheet = buildPlannedCostSheet(
    productCardId,
    card.bom,
    nextRevisionNo,
    'Draft',
    actorUserId,
    reason,
    lines,
    card.costSheet.quantityBasis,
  )
  costSheet.activeRevisionRecordId = revisionRecord.id
  costSheet.revisionHistory = [...card.costSheet.revisionHistory, ...costSheet.revisionHistory]

  const validation = validateCostSheet(costSheet)
  if (!validation.valid) throw new CostSheetDomainError(validation.errors.join(', '))

  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(
    saved,
    'UPDATE',
    actorUserId,
    { revisionNo: card.costSheet.revisionNo },
    { revisionNo: nextRevisionNo },
    reason,
  )
  appendTimeline(saved, actorUserId, 'COST_SHEET_REVISION', reason)
  publishCostSheet(saved, 'revision_created', actorUserId)
  return saved.costSheet
}

export function persistActivateCostSheetRevision(
  productCardId: string,
  revisionRecordId: string,
  expectedVersion: number,
  actorUserId: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  let card = loadCard(productCardId)
  let version = expectedVersion

  if (card.costSheet.status === 'Draft') {
    const submitted = transitionCostSheetStatus(
      card.costSheet,
      'Under Review',
      actorUserId,
      'Aktivasyon öncesi inceleme',
    )
    card = saveCard({ ...card, costSheet: submitted }, version)
    version = cardVersion(productCardId)
    card = loadCard(productCardId)
  }
  if (card.costSheet.status === 'Under Review') {
    const approved = transitionCostSheetStatus(card.costSheet, 'Approved', actorUserId, 'Aktivasyon öncesi onay')
    card = saveCard({ ...card, costSheet: approved }, version)
    version = cardVersion(productCardId)
    card = loadCard(productCardId)
  }

  const revisions = getRevisions('CostSheet', card.costSheet.id)
  const recordId =
    revisionRecordId ||
    card.costSheet.activeRevisionRecordId ||
    revisions.find((r) => r.revision.status === 'Draft')?.id
  if (recordId) {
    activateRevision({ recordId, approvedBy: actorUserId })
  }

  const costSheet = transitionCostSheetStatus(card.costSheet, 'Active', actorUserId, 'Revizyon aktive edildi')
  costSheet.activeRevisionRecordId = recordId || card.costSheet.activeRevisionRecordId
  const saved = saveCard({ ...card, costSheet }, version)
  auditCostSheet(saved, 'UPDATE', actorUserId, { status: card.costSheet.status }, { status: 'Active' })
  appendTimeline(saved, actorUserId, 'COST_SHEET_ACTIVATED', 'Maliyet revizyonu aktive edildi')
  publishCostSheet(saved, 'activated', actorUserId)
  return saved.costSheet
}

export function persistArchiveCostSheet(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  const costSheet = transitionCostSheetStatus(card.costSheet, 'Archived', actorUserId, 'Arşivlendi')
  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(saved, 'UPDATE', actorUserId, { status: card.costSheet.status }, { status: 'Archived' })
  appendTimeline(saved, actorUserId, 'COST_SHEET_ARCHIVED', 'Maliyet çizelgesi arşivlendi')
  publishCostSheet(saved, 'archived', actorUserId)
  return saved.costSheet
}

export function persistRecalculatePlannedCost(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
): PlannedCostSheet {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  assertCostSheetEditable(card.costSheet)
  const costSheet = recalculatePlannedCostFromBom(card.costSheet, card.bom)
  const validation = validateCostSheet(costSheet)
  if (!validation.valid) throw new CostSheetDomainError(validation.errors.join(', '))
  const saved = saveCard({ ...card, costSheet }, expectedVersion)
  auditCostSheet(
    saved,
    'UPDATE',
    actorUserId,
    { bomRevisionNo: card.costSheet.bomRevisionNo },
    { bomRevisionNo: costSheet.bomRevisionNo },
    'BOM değişikliği sonrası yeniden hesaplama',
  )
  appendTimeline(saved, actorUserId, 'COST_SHEET_RECALC', 'BOM değişikliği ile planlanan maliyet güncellendi')
  publishCostSheet(saved, 'recalculated', actorUserId)
  return saved.costSheet
}
