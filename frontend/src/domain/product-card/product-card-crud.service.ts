/**
 * Product Card aggregate — read/write domain service.
 * Repository port + transaction + audit + timeline + outbox.
 */
import {
  brandRepository,
  buyerRepository,
  collectionRepository,
  countryRepository,
  customerRepository,
  fabricCompositionRepository,
  fabricTypeRepository,
  merchandiserRepository,
  productGroupRepository,
  seasonRepository,
  subProductGroupRepository,
  sizeSetRepository,
} from '@/domain/master-data'
import {
  AGE_GROUPS,
  EMBROIDERY_TYPES,
  FITS,
  GENDERS,
  GTIP_CODES,
  pickLookup,
  PRINT_TYPES,
  WASH_TYPES,
} from '@/domain/master-data/textile-lookups'
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import {
  findProductCardTransition,
  isProductCardEditable,
  isProductCardTransitionAllowed,
  type ProductCardLifecycleStatus,
} from '@/domain/product-card/lifecycle-types'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedProductCard } from '@/domain/ports/persistence/persistence-aggregates'
import { scheduleProductCardChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { buildBillOfMaterials } from '@/domain/services/textile/bom-service'
import { buildPlannedCostSheet } from '@/domain/services/textile/cost-sheet-service'
import { buildProductColorAssignments } from '@/domain/services/textile/color-management-service'
import { calcActualConsumption } from '@/domain/services/calculations'
import type {
  ProductCardMasterRefs,
  ProductCardRevision,
  TextileProductCard,
} from '@/domain/types/textile-erp'

import type { IProductCardRepository } from '@/domain/ports/persistence/aggregates/product-card.repository'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

export class ProductCardDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductCardDomainError'
  }
}

function productCardRepo(): IProductCardRepository {
  return requireUnitOfWork().productCards
}

function pickField(key: string, fallback: string, input: Record<string, unknown>): string {
  return typeof input[key] === 'string' && input[key] ? (input[key] as string) : fallback
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

function resolveName<T extends { name: string }>(
  repo: { getById(id: string): T | undefined },
  id: string,
): string {
  return repo.getById(id)?.name ?? id
}

function buildResolvedView(refs: ProductCardMasterRefs, index = 0) {
  return {
    customer: resolveName(customerRepository, refs.customerId),
    brand: resolveName(brandRepository, refs.brandId),
    buyer: resolveName(buyerRepository, refs.buyerId),
    merchandiser: resolveName(merchandiserRepository, refs.merchandiserId),
    season: resolveName(seasonRepository, refs.seasonId),
    collection: resolveName(collectionRepository, refs.collectionId),
    productGroup: resolveName(productGroupRepository, refs.productGroupId),
    subGroup: resolveName(subProductGroupRepository, refs.subProductGroupId),
    gender: pickLookup(GENDERS, index).name,
    ageGroup: pickLookup(AGE_GROUPS, index).name,
    fit: pickLookup(FITS, index).name,
    countryOfOrigin: resolveName(countryRepository, refs.countryOfOriginId),
    gtip: pickLookup(GTIP_CODES, index).code,
    fabricType: resolveName(fabricTypeRepository, refs.fabricTypeId),
    composition: fabricCompositionRepository.getById(refs.fabricCompositionId)?.fiberContent ?? '',
    wash: pickLookup(WASH_TYPES, index).name,
    print: pickLookup(PRINT_TYPES, index).name,
    embroidery: pickLookup(EMBROIDERY_TYPES, index).name,
    mainFabric: refs.mainFabricStockCardId,
  }
}

function defaultRefs(input: Record<string, unknown>): ProductCardMasterRefs {
  const customers = customerRepository.getActive()
  const brands = brandRepository.getActive()
  const buyers = buyerRepository.getActive()
  const merchs = merchandiserRepository.getActive()
  const seasons = seasonRepository.getActive()
  const collections = collectionRepository.getActive()
  const pgs = productGroupRepository.getActive()
  const spgs = subProductGroupRepository.getActive()
  const fts = fabricTypeRepository.getActive()
  const fcs = fabricCompositionRepository.getActive()
  const countries = countryRepository.getActive()
  const sizeSets = sizeSetRepository.getActive()

  return {
    customerId: pickField('customerId', customers[0]?.id ?? '', input),
    brandId: pickField('brandId', brands[0]?.id ?? '', input),
    buyerId: pickField('buyerId', buyers[0]?.id ?? '', input),
    merchandiserId: pickField('merchandiserId', merchs[0]?.id ?? '', input),
    seasonId: pickField('seasonId', seasons[0]?.id ?? '', input),
    collectionId: pickField('collectionId', collections[0]?.id ?? '', input),
    productGroupId: pickField('productGroupId', pgs[0]?.id ?? '', input),
    subProductGroupId: pickField('subProductGroupId', spgs[0]?.id ?? '', input),
    genderId: pickField('genderId', pickLookup(GENDERS, 0).id, input),
    ageGroupId: pickField('ageGroupId', pickLookup(AGE_GROUPS, 0).id, input),
    fitId: pickField('fitId', pickLookup(FITS, 0).id, input),
    countryOfOriginId: pickField('countryOfOriginId', countries[0]?.id ?? '', input),
    gtipId: pickField('gtipId', pickLookup(GTIP_CODES, 0).id, input),
    fabricTypeId: pickField('fabricTypeId', fts[0]?.id ?? '', input),
    fabricCompositionId: pickField('fabricCompositionId', fcs[0]?.id ?? '', input),
    washTypeId: pickField('washTypeId', pickLookup(WASH_TYPES, 0).id, input),
    printTypeId: pickField('printTypeId', pickLookup(PRINT_TYPES, 0).id, input),
    embroideryTypeId: pickField('embroideryTypeId', pickLookup(EMBROIDERY_TYPES, 0).id, input),
    mainFabricStockCardId: 'sc-1',
    auxiliaryFabricStockCardIds: ['sc-6'],
    sizeSetId: pickField('sizeSetId', sizeSets[0]?.id ?? '', input),
  }
}

function defaultBomLines() {
  return [
    { id: 'bom-1', stockCardId: 'sc-1', consumption: 1.55, wastePercent: 3 },
    { id: 'bom-2', stockCardId: 'sc-6', consumption: 0.22, wastePercent: 5 },
    { id: 'bom-3', stockCardId: 'sc-8', consumption: 8, wastePercent: 2 },
  ].map((l) => ({
    ...l,
    actualConsumption: calcActualConsumption(l.consumption, l.wastePercent),
  }))
}

function nextProductCardId(): string {
  const all = queryAllProductCards()
  const max = all.reduce((m, c) => Math.max(m, Number.parseInt(c.id, 10) || 0), 0)
  return String(max + 1)
}

function appendTimeline(
  card: TextileProductCard,
  actorUserId: string,
  action: string,
  reason: string,
): void {
  appendEnterpriseTimelineEntry({
    id: `tl-pc-${card.id}-${Date.now()}`,
    entityType: 'PRODUCT_CARD',
    entityId: card.id,
    entityCode: card.productCode,
    occurredAt: new Date().toISOString(),
    actor: actorUserId,
    action,
    reason,
  })
}

function publishOutbox(
  card: TextileProductCard,
  changeType: string,
  actorUserId: string,
): void {
  scheduleProductCardChange({
    productCardId: card.id,
    productCode: card.productCode,
    status: card.status,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

function auditChange(
  card: TextileProductCard,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  actorUserId: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  description?: string,
): void {
  logAudit('ProductCard', card.id, action, { ...auditContext(actorUserId), description }, oldValue, newValue)
}

function saveCard(
  card: TextileProductCard,
  expectedVersion?: number,
): TextileProductCard {
  const repo = productCardRepo()
  const existing = repo.findById(DEFAULT_TENANT_ID, card.id)
  const persisted: PersistedProductCard = {
    ...card,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  const saved = repo.save(DEFAULT_TENANT_ID, persisted, { expectedVersion })
  return stripCard(saved)
}

function transitionStatus(
  card: TextileProductCard,
  to: ProductCardLifecycleStatus,
  actorUserId: string,
  note: string,
): TextileProductCard {
  if (!isProductCardTransitionAllowed(card.status, to)) {
    throw new ProductCardDomainError(`Geçiş izni yok: ${card.status} → ${to}`)
  }
  const rule = findProductCardTransition(card.status, to)!
  const now = new Date().toISOString()
  const revision: ProductCardRevision = {
    ...card.currentRevision,
    status: to,
    changedAt: now,
    changedById: actorUserId,
    changeNote: note || rule.label,
  }
  return {
    ...card,
    status: to,
    currentRevision: revision,
    revisionHistory: [...card.revisionHistory.slice(0, -1), revision],
  }
}

export function queryAllProductCards(): TextileProductCard[] {
  const page = productCardRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripCard)
}

export function queryApprovedProductCards(): TextileProductCard[] {
  return queryAllProductCards().filter((c) => c.status === 'Approved')
}

export function queryProductCardById(id: string): TextileProductCard | null {
  const row = productCardRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? stripCard(row) : null
}

export function queryProductCardByCode(code: string): TextileProductCard | null {
  const row = productCardRepo().findByProductCode(DEFAULT_TENANT_ID, code)
  return row ? stripCard(row) : null
}

export function queryProductCardVersion(id: string): number {
  return productCardRepo().version(DEFAULT_TENANT_ID, id)
}

export function persistCreateProductCard(
  input: Record<string, unknown>,
  actorUserId: string,
): TextileProductCard {
  const productCode = String(input.productCode ?? '').trim()
  const productName = String(input.productName ?? '').trim()
  if (!productCode || !productName) {
    throw new ProductCardDomainError('Ürün kodu ve adı zorunludur.')
  }
  if (queryProductCardByCode(productCode)) {
    throw new ProductCardDomainError(`Ürün kodu zaten kullanılıyor: ${productCode}`)
  }

  const id = nextProductCardId()
  const refs = defaultRefs(input)
  const now = new Date().toISOString()
  const revision: ProductCardRevision = {
    revisionNo: 1,
    status: 'Draft',
    changedAt: now,
    changedById: actorUserId,
    changeNote: 'İlk oluşturma',
  }
  const legacyBom = defaultBomLines()
  const bomEntity = buildBillOfMaterials(id, legacyBom, 1, 'Draft', actorUserId, 'İlk BOM')
  const card: TextileProductCard = {
    id,
    productCode,
    customerModelNo: String(input.customerModelNo ?? `CM-${8800 + Number(id)}`),
    internalModelNo: String(input.internalModelNo ?? `IM-${4200 + Number(id)}`),
    productName,
    pattern: String(input.pattern ?? `PAT-${100 + Number(id)}`),
    weight: String(input.weight ?? '220 g/m²'),
    description: String(input.description ?? productName),
    technicalSheetRef: `TF-${id}-R1`,
    measurementChartId: `mc-${id}`,
    refs,
    resolved: buildResolvedView(refs, Number(id)),
    colorAssignments: buildProductColorAssignments(2, Number(id)),
    bom: bomEntity,
    costSheet: buildPlannedCostSheet(id, bomEntity, 1, 'Draft', actorUserId, 'İlk maliyet çizelgesi'),
    currentRevision: revision,
    revisionHistory: [revision],
    status: 'Draft',
  }

  const saved = saveCard(card)
  auditChange(saved, 'CREATE', actorUserId, null, { status: saved.status, productCode: saved.productCode })
  appendTimeline(saved, actorUserId, 'CREATE', 'Ürün kartı oluşturuldu')
  publishOutbox(saved, 'created', actorUserId)
  return saved
}

export function persistUpdateProductCard(
  id: string,
  input: Record<string, unknown>,
  expectedVersion: number,
  actorUserId: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  if (!isProductCardEditable(existing.status)) {
    throw new ProductCardDomainError(`Durum ${existing.status} iken güncelleme yapılamaz.`)
  }
  const currentVersion = queryProductCardVersion(id)
  if (currentVersion !== expectedVersion) {
    throw new ProductCardDomainError(
      `Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${currentVersion}`,
    )
  }

  const refs = { ...existing.refs, ...pickRefUpdates(input) }
  const updated: TextileProductCard = {
    ...existing,
    productCode: String(input.productCode ?? existing.productCode).trim(),
    productName: String(input.productName ?? existing.productName).trim(),
    customerModelNo: String(input.customerModelNo ?? existing.customerModelNo),
    internalModelNo: String(input.internalModelNo ?? existing.internalModelNo),
    pattern: String(input.pattern ?? existing.pattern),
    weight: String(input.weight ?? existing.weight),
    description: String(input.description ?? existing.description),
    refs,
    resolved: buildResolvedView(refs, Number(existing.id)),
  }

  if (updated.productCode !== existing.productCode) {
    const dup = queryProductCardByCode(updated.productCode)
    if (dup && dup.id !== id) {
      throw new ProductCardDomainError(`Ürün kodu zaten kullanılıyor: ${updated.productCode}`)
    }
  }

  const saved = saveCard(updated, expectedVersion)
  auditChange(
    saved,
    'UPDATE',
    actorUserId,
    { productCode: existing.productCode, productName: existing.productName },
    { productCode: saved.productCode, productName: saved.productName },
  )
  appendTimeline(saved, actorUserId, 'UPDATE', 'Ürün kartı güncellendi')
  publishOutbox(saved, 'updated', actorUserId)
  return saved
}

function pickRefUpdates(input: Record<string, unknown>): Partial<ProductCardMasterRefs> {
  const keys: (keyof ProductCardMasterRefs)[] = [
    'customerId',
    'brandId',
    'buyerId',
    'merchandiserId',
    'seasonId',
    'collectionId',
    'productGroupId',
    'subProductGroupId',
    'sizeSetId',
  ]
  const out: Partial<ProductCardMasterRefs> = {}
  for (const key of keys) {
    if (typeof input[key] === 'string' && input[key]) {
      ;(out as Record<string, string>)[key] = input[key] as string
    }
  }
  return out
}

export function persistCreateProductCardRevision(
  id: string,
  reason: string,
  expectedVersion: number,
  actorUserId: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const currentVersion = queryProductCardVersion(id)
  if (currentVersion !== expectedVersion) {
    throw new ProductCardDomainError(
      `Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${currentVersion}`,
    )
  }
  if (existing.status !== 'Approved' && existing.status !== 'Closed') {
    throw new ProductCardDomainError('Revizyon yalnızca Onaylı veya Kapalı kartlardan oluşturulabilir.')
  }

  const now = new Date().toISOString()
  const nextRevisionNo = existing.currentRevision.revisionNo + 1
  const frozenHistory = [...existing.revisionHistory]
  const newRevision: ProductCardRevision = {
    revisionNo: nextRevisionNo,
    status: 'Draft',
    changedAt: now,
    changedById: actorUserId,
    changeNote: reason || `Revizyon ${nextRevisionNo}`,
  }

  const updated: TextileProductCard = {
    ...existing,
    status: 'Draft',
    currentRevision: newRevision,
    revisionHistory: [...frozenHistory, newRevision],
    technicalSheetRef: `TF-${id}-R${nextRevisionNo}`,
  }

  const saved = saveCard(updated, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { revisionNo: existing.currentRevision.revisionNo }, { revisionNo: nextRevisionNo }, 'Revizyon oluşturuldu')
  appendTimeline(saved, actorUserId, 'REVISION_CREATED', newRevision.changeNote)
  publishOutbox(saved, 'revision_created', actorUserId)
  return saved
}

export function persistApproveProductCard(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  comment?: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const currentVersion = queryProductCardVersion(id)
  if (currentVersion !== expectedVersion) {
    throw new ProductCardDomainError(
      `Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${currentVersion}`,
    )
  }

  let card = existing
  if (existing.status === 'Draft') {
    card = transitionStatus(existing, 'Under Review', actorUserId, 'İncelemeye gönderildi')
    card = saveCard(card, expectedVersion)
    expectedVersion = queryProductCardVersion(id)
  }
  if (card.status === 'Under Review') {
    card = transitionStatus(card, 'Approved', actorUserId, comment ?? 'Onaylandı')
  } else if (card.status !== 'Approved') {
    throw new ProductCardDomainError(`Onay için durum Under Review olmalı. Mevcut: ${card.status}`)
  }

  const saved = saveCard(card, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { status: existing.status }, { status: saved.status }, comment ?? 'Onay')
  appendTimeline(saved, actorUserId, 'APPROVED', comment ?? 'Ürün kartı onaylandı')
  publishOutbox(saved, 'approved', actorUserId)
  return saved
}

export function persistActivateProductCard(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const card = transitionStatus(existing, 'In Production', actorUserId, 'Üretime alındı')
  const saved = saveCard(card, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { status: existing.status }, { status: saved.status }, 'Activate')
  appendTimeline(saved, actorUserId, 'ACTIVATED', 'Üretime alındı')
  publishOutbox(saved, 'activated', actorUserId)
  return saved
}

export function persistDeactivateProductCard(
  id: string,
  expectedVersion: number,
  actorUserId: string,
  reason?: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const card = transitionStatus(existing, 'Closed', actorUserId, reason ?? 'Deaktive edildi')
  const saved = saveCard(card, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { status: existing.status }, { status: saved.status }, reason)
  appendTimeline(saved, actorUserId, 'DEACTIVATED', reason ?? 'Kapatıldı')
  publishOutbox(saved, 'deactivated', actorUserId)
  return saved
}

export function persistArchiveProductCard(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const card = transitionStatus(existing, 'Archived', actorUserId, 'Arşivlendi')
  const saved = saveCard(card, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { status: existing.status }, { status: saved.status }, 'Archive')
  appendTimeline(saved, actorUserId, 'ARCHIVED', 'Arşivlendi')
  publishOutbox(saved, 'archived', actorUserId)
  return saved
}

export function persistSubmitProductCardForReview(
  id: string,
  expectedVersion: number,
  actorUserId: string,
): TextileProductCard {
  const existing = queryProductCardById(id)
  if (!existing) throw new ProductCardDomainError('Ürün kartı bulunamadı.')
  const card = transitionStatus(existing, 'Under Review', actorUserId, 'İncelemeye gönderildi')
  const saved = saveCard(card, expectedVersion)
  auditChange(saved, 'UPDATE', actorUserId, { status: existing.status }, { status: saved.status })
  appendTimeline(saved, actorUserId, 'SUBMITTED', 'İncelemeye gönderildi')
  publishOutbox(saved, 'submitted', actorUserId)
  return saved
}
