/**
 * BOM CRUD — Product Card aggregate child entity write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import {
  isBomEditable,
  isBomReadOnly,
  isBomTransitionAllowed,
} from '@/domain/bom/bom-lifecycle.types'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedProductCard } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductCardRepository } from '@/domain/ports/persistence/aggregates/product-card.repository'
import { syncCostSheetAfterBomChange } from '@/domain/cost-sheet/cost-sheet-crud.service'
import { scheduleBomChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import {
  activateRevision,
  createRevision,
  getRevisions,
} from '@/domain/platform/services/versioning-service'
import {
  bomLinesFromInput,
  buildBillOfMaterials,
  enrichBomLinesWithRequirement,
  normalizeBillOfMaterials,
  validateBom,
  type BomLineInput,
} from '@/domain/services/textile/bom-service'
import { queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type {
  BillOfMaterials,
  BomLifecycleStatus,
  BomRevisionSnapshot,
  TextileProductCard,
} from '@/domain/types/textile-erp'

export class BomDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BomDomainError'
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
  if (!row) throw new BomDomainError('Ürün kartı bulunamadı.')
  const card = stripCard(row)
  return { ...card, bom: normalizeBillOfMaterials(card.bom) }
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

function withCostSheetSync(card: TextileProductCard): TextileProductCard {
  return syncCostSheetAfterBomChange(card)
}

function assertBomEditable(bom: BillOfMaterials): void {
  if (isBomReadOnly(bom.status)) {
    throw new BomDomainError('Arşivlenmiş BOM düzenlenemez.')
  }
  if (!isBomEditable(bom.status)) {
    throw new BomDomainError(`BOM durumu ${bom.status} iken düzenleme yapılamaz. Revizyon oluşturun.`)
  }
}

function assertVersion(productCardId: string, expectedVersion: number): void {
  const current = cardVersion(productCardId)
  if (current !== expectedVersion) {
    throw new BomDomainError(`Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${current}`)
  }
}

function validateLineInputs(lines: BomLineInput[]): void {
  for (const line of lines) {
    if (!queryStockCardById(line.stockCardId)) {
      throw new BomDomainError(`Geçersiz stok kartı: ${line.stockCardId}`)
    }
    if (line.alternativeStockCardId && !queryStockCardById(line.alternativeStockCardId)) {
      throw new BomDomainError(`Geçersiz alternatif stok kartı: ${line.alternativeStockCardId}`)
    }
    if (line.consumption <= 0) throw new BomDomainError('Tüketim sıfırdan büyük olmalı.')
  }
}

function appendTimeline(card: TextileProductCard, actorUserId: string, action: string, reason: string): void {
  appendEnterpriseTimelineEntry({
    id: `tl-bom-${card.id}-${Date.now()}`,
    entityType: 'PRODUCT_CARD',
    entityId: card.id,
    entityCode: card.productCode,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

function auditBom(
  card: TextileProductCard,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  actorUserId: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  description?: string,
): void {
  logAudit('BOM', card.bom.id, action, { ...auditContext(actorUserId), description }, oldValue, newValue)
}

function publishBom(card: TextileProductCard, changeType: string, actorUserId: string): void {
  scheduleBomChange({
    productCardId: card.id,
    bomId: card.bom.id,
    revisionNo: card.bom.revisionNo,
    status: card.bom.status,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

function transitionBomStatus(
  bom: BillOfMaterials,
  to: BomLifecycleStatus,
  actorUserId: string,
  note: string,
): BillOfMaterials {
  if (!isBomTransitionAllowed(bom.status, to)) {
    throw new BomDomainError(`BOM geçişi izni yok: ${bom.status} → ${to}`)
  }
  const now = new Date().toISOString()
  const snapshot: BomRevisionSnapshot = {
    revisionNo: bom.revisionNo,
    status: to,
    changedAt: now,
    changedById: actorUserId,
    changeNote: note,
    lineCount: bom.lines.length,
    entityRevisionId: bom.activeRevisionRecordId,
  }
  return {
    ...bom,
    status: to,
    generatedAt: now,
    revisionHistory: [...bom.revisionHistory, snapshot],
  }
}

export function queryBomByProductId(productCardId: string): BillOfMaterials | null {
  const card = loadCard(productCardId)
  return card.bom
}

export function queryBomVersion(productCardId: string): number {
  return cardVersion(productCardId)
}

export function queryBomEntityRevisions(productCardId: string) {
  const card = loadCard(productCardId)
  return getRevisions('BOM', card.bom.id)
}

export function persistCreateBom(
  productCardId: string,
  lines: BomLineInput[],
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  validateLineInputs(lines)
  const card = loadCard(productCardId)
  if (card.bom.lines.length > 0 && card.bom.status !== 'Archived') {
    throw new BomDomainError('BOM zaten mevcut. Güncelleme veya revizyon kullanın.')
  }

  const legacyLines = bomLinesFromInput(lines)
  const bom = buildBillOfMaterials(productCardId, legacyLines, 1, 'Draft', actorUserId, 'BOM oluşturuldu')
  const validation = validateBom(bom)
  if (!validation.valid) throw new BomDomainError(validation.errors.join(', '))

  const saved = saveCard(withCostSheetSync({ ...card, bom }), expectedVersion)
  auditBom(saved, 'CREATE', actorUserId, null, { lineCount: bom.lines.length })
  appendTimeline(saved, actorUserId, 'BOM_CREATE', 'BOM oluşturuldu')
  publishBom(saved, 'created', actorUserId)
  return saved.bom
}

export function persistUpdateBom(
  productCardId: string,
  lines: BomLineInput[],
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  validateLineInputs(lines)
  const card = loadCard(productCardId)
  assertBomEditable(card.bom)

  const updatedBom = enrichBomLinesWithRequirement(card.bom, lines)
  const validation = validateBom(updatedBom)
  if (!validation.valid) throw new BomDomainError(validation.errors.join(', '))

  const oldCount = card.bom.lines.length
  const saved = saveCard(withCostSheetSync({ ...card, bom: updatedBom }), expectedVersion)
  auditBom(saved, 'UPDATE', actorUserId, { lineCount: oldCount }, { lineCount: saved.bom.lines.length })
  appendTimeline(saved, actorUserId, 'BOM_UPDATE', 'BOM güncellendi')
  publishBom(saved, 'updated', actorUserId)
  return saved.bom
}

export function persistDeleteBomLine(
  productCardId: string,
  lineId: string,
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  const card = loadCard(productCardId)
  assertBomEditable(card.bom)
  const lines = card.bom.lines.filter((l) => l.id !== lineId)
  if (lines.length === card.bom.lines.length) {
    throw new BomDomainError('BOM satırı bulunamadı.')
  }
  return persistUpdateBom(
    productCardId,
    lines.map((l) => ({
      id: l.id,
      stockCardId: l.stockCardId,
      consumption: l.consumption,
      wastePercent: l.wastePercent,
      alternativeStockCardId: l.alternativeStockCardId,
      notes: l.notes,
      requirement: l.requirement,
    })),
    expectedVersion,
    actorUserId,
  )
}

export function persistSubmitBomForReview(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  const validation = validateBom(card.bom)
  if (!validation.valid) throw new BomDomainError(validation.errors.join(', '))

  const bom = transitionBomStatus(card.bom, 'Under Review', actorUserId, 'İncelemeye gönderildi')
  const saved = saveCard(withCostSheetSync({ ...card, bom }), expectedVersion)
  auditBom(saved, 'UPDATE', actorUserId, { status: card.bom.status }, { status: bom.status })
  appendTimeline(saved, actorUserId, 'BOM_SUBMITTED', 'BOM incelemeye gönderildi')
  publishBom(saved, 'submitted', actorUserId)
  return saved.bom
}

export function persistApproveBom(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
  comment?: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  let card = loadCard(productCardId)

  if (card.bom.status === 'Draft') {
    const submitted = transitionBomStatus(card.bom, 'Under Review', actorUserId, 'İncelemeye gönderildi')
    card = saveCard(withCostSheetSync({ ...card, bom: submitted }), expectedVersion)
    expectedVersion = cardVersion(productCardId)
    card = loadCard(productCardId)
  }

  if (card.bom.status !== 'Under Review') {
    throw new BomDomainError(`Onay için BOM Under Review olmalı. Mevcut: ${card.bom.status}`)
  }

  const bom = transitionBomStatus(card.bom, 'Approved', actorUserId, comment ?? 'Onaylandı')
  const saved = saveCard(withCostSheetSync({ ...card, bom }), expectedVersion)
  auditBom(saved, 'UPDATE', actorUserId, { status: card.bom.status }, { status: bom.status }, comment)
  appendTimeline(saved, actorUserId, 'BOM_APPROVED', comment ?? 'BOM onaylandı')
  publishBom(saved, 'approved', actorUserId)
  return saved.bom
}

export function persistCreateBomRevision(
  productCardId: string,
  reason: string,
  lines: BomLineInput[],
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  validateLineInputs(lines)
  const card = loadCard(productCardId)
  if (card.bom.status !== 'Active' && card.bom.status !== 'Approved' && card.bom.status !== 'Archived') {
    throw new BomDomainError('Revizyon yalnızca Active, Approved veya Archived BOM\'dan oluşturulabilir.')
  }

  const nextRevisionNo = card.bom.revisionNo + 1
  const legacyLines = bomLinesFromInput(lines)
  const payload = {
    lines: legacyLines.map((l) => ({
      stockCardId: l.stockCardId,
      consumption: l.consumption,
      wastePercent: l.wastePercent,
      alternativeStockCardId: l.alternativeStockCardId,
      notes: l.notes,
    })),
    revisionNo: nextRevisionNo,
  }

  const revisionRecord = createRevision({
    entityType: 'BOM',
    entityKey: card.bom.id,
    payload,
    version: `R${nextRevisionNo}`,
    reasonOfChange: reason,
    createdBy: actorUserId,
    status: 'Draft',
  })

  const bom = buildBillOfMaterials(
    productCardId,
    legacyLines,
    nextRevisionNo,
    'Draft',
    actorUserId,
    reason,
  )
  bom.activeRevisionRecordId = revisionRecord.id
  bom.revisionHistory = [...card.bom.revisionHistory, ...bom.revisionHistory]

  const validation = validateBom(bom)
  if (!validation.valid) throw new BomDomainError(validation.errors.join(', '))

  const saved = saveCard(withCostSheetSync({ ...card, bom }), expectedVersion)
  auditBom(saved, 'UPDATE', actorUserId, { revisionNo: card.bom.revisionNo }, { revisionNo: nextRevisionNo }, reason)
  appendTimeline(saved, actorUserId, 'BOM_REVISION', reason)
  publishBom(saved, 'revision_created', actorUserId)
  return saved.bom
}

export function persistActivateBomRevision(
  productCardId: string,
  revisionRecordId: string,
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  let card = loadCard(productCardId)
  let version = expectedVersion

  if (card.bom.status === 'Draft') {
    const submitted = transitionBomStatus(card.bom, 'Under Review', actorUserId, 'Aktivasyon öncesi inceleme')
    card = saveCard(withCostSheetSync({ ...card, bom: submitted }), version)
    version = cardVersion(productCardId)
    card = loadCard(productCardId)
  }
  if (card.bom.status === 'Under Review') {
    const approved = transitionBomStatus(card.bom, 'Approved', actorUserId, 'Aktivasyon öncesi onay')
    card = saveCard(withCostSheetSync({ ...card, bom: approved }), version)
    version = cardVersion(productCardId)
    card = loadCard(productCardId)
  }

  const revisions = getRevisions('BOM', card.bom.id)
  const recordId =
    revisionRecordId ||
    card.bom.activeRevisionRecordId ||
    revisions.find((r) => r.revision.status === 'Draft')?.id
  if (recordId) {
    activateRevision({ recordId, approvedBy: actorUserId })
  }

  const bom = transitionBomStatus(card.bom, 'Active', actorUserId, 'Revizyon aktive edildi')
  bom.activeRevisionRecordId = recordId || card.bom.activeRevisionRecordId
  const saved = saveCard(withCostSheetSync({ ...card, bom }), version)
  auditBom(saved, 'UPDATE', actorUserId, { status: card.bom.status }, { status: 'Active' })
  appendTimeline(saved, actorUserId, 'BOM_ACTIVATED', 'BOM revizyonu aktive edildi')
  publishBom(saved, 'activated', actorUserId)
  return saved.bom
}

export function persistArchiveBom(
  productCardId: string,
  expectedVersion: number,
  actorUserId: string,
): BillOfMaterials {
  assertVersion(productCardId, expectedVersion)
  const card = loadCard(productCardId)
  const bom = transitionBomStatus(card.bom, 'Archived', actorUserId, 'Arşivlendi')
  const saved = saveCard(withCostSheetSync({ ...card, bom }), expectedVersion)
  auditBom(saved, 'UPDATE', actorUserId, { status: card.bom.status }, { status: 'Archived' })
  appendTimeline(saved, actorUserId, 'BOM_ARCHIVED', 'BOM arşivlendi')
  publishBom(saved, 'archived', actorUserId)
  return saved.bom
}
