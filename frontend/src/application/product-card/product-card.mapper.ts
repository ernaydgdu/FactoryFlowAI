import { sizeSetRepository } from '@/domain/master-data'
import { buildProductCardRelations } from '@/domain/enterprise/relations/product-card-relations'
import { getEnterpriseDocuments } from '@/domain/enterprise/collaboration-service'
import { getEnterpriseTimeline } from '@/domain/enterprise/enterprise-timeline-service'
import {
  isProductCardEditable,
  isProductCardReadOnly,
} from '@/domain/product-card/lifecycle-types'
import { toSizeSetEntity } from '@/domain/services/textile/size-matrix-service'
import { toColorCardEntity } from '@/domain/services/textile/color-management-service'
import type { ProductColorAssignment, TextileProductCard } from '@/domain/types/textile-erp'

import {
  queryProductCard,
  queryProductCards,
  queryProductCardAggregateVersion,
} from './product-card-command.mapper'
import type {
  ProductCardBomLineDto,
  ProductCardColorDto,
  ProductCardDetailDto,
  ProductCardEditDto,
  ProductCardKpisDto,
  ProductCardListItemDto,
  ProductCardRevisionDto,
  ProductCardSizeMatrixDto,
} from './product-card.dto'
import { productCardLifecycleLabel, productCardStatusBadge } from './product-card.dto'

function mapSizeMatrix(sizeSetId: string): ProductCardSizeMatrixDto {
  const entity = sizeSetRepository.getById(sizeSetId)
  const sizeSet = entity ? toSizeSetEntity(entity.id) : undefined
  return {
    sizeSetName: sizeSet?.name ?? '—',
    sizes: sizeSet?.sizes ?? [],
    totalRatio: sizeSet?.sizes.length ?? 0,
  }
}

function mapColors(colorAssignments: ProductColorAssignment[]): ProductCardColorDto[] {
  return colorAssignments.map((ca, i) => {
    const cc = toColorCardEntity(ca.colorCardId)
    return {
      id: ca.colorCardId,
      colorCode: cc?.code ?? ca.colorCardId,
      colorName: cc?.name ?? ca.colorCardId,
      pantone: cc?.pantone,
      isDefault: i === 0,
    }
  })
}

function mapRevisions(history: TextileProductCard['revisionHistory']): ProductCardRevisionDto[] {
  return history.map((r) => ({
    revisionNo: r.revisionNo,
    status: productCardLifecycleLabel(r.status),
    changedAt: r.changedAt,
    changedBy: r.changedById,
    changeNote: r.changeNote,
  }))
}

export function mapProductCardListItem(card: TextileProductCard): ProductCardListItemDto {
  const sizeSet = sizeSetRepository.getById(card.refs.sizeSetId)
  return {
    id: card.id,
    productCode: card.productCode,
    productName: card.productName,
    customer: card.resolved.customer,
    brand: card.resolved.brand,
    season: card.resolved.season,
    sizeSetName: sizeSet?.name ?? '—',
    colorCount: card.colorAssignments.length,
    bomLineCount: card.bom.lines.length,
    status: productCardStatusBadge(card.status),
    lifecycleStatus: card.status,
    version: queryProductCardAggregateVersion(card.id),
    editable: isProductCardEditable(card.status),
    readOnly: isProductCardReadOnly(card.status),
  }
}

export function mapProductCardDetail(id: string): ProductCardDetailDto | null {
  const card = queryProductCard(id)
  if (!card) return null

  const relations = buildProductCardRelations(id)
  const documents = getEnterpriseDocuments('PRODUCT_CARD', id)
  const timeline = getEnterpriseTimeline('PRODUCT_CARD', id)

  const bom: ProductCardBomLineDto[] = card.bom.lines.map((l) => ({
    id: l.id,
    materialCode: l.materialCode,
    materialName: l.materialName,
    category: l.category,
    unit: l.unit,
    consumption: l.consumption,
    wastePercent: l.wastePercent,
    actualConsumption: l.actualConsumption,
    warehouseCode: l.warehouseCode,
    leadTimeDays: l.leadTimeDays,
  }))

  return {
    id: card.id,
    productCode: card.productCode,
    productName: card.productName,
    customerModelNo: card.customerModelNo,
    internalModelNo: card.internalModelNo,
    status: productCardStatusBadge(card.status),
    lifecycleStatus: card.status,
    version: queryProductCardAggregateVersion(card.id),
    editable: isProductCardEditable(card.status),
    readOnly: isProductCardReadOnly(card.status),
    header: {
      customer: card.resolved.customer,
      brand: card.resolved.brand,
      buyer: card.resolved.buyer,
      merchandiser: card.resolved.merchandiser,
      season: card.resolved.season,
      collection: card.resolved.collection,
    },
    classification: {
      productGroup: card.resolved.productGroup,
      subGroup: card.resolved.subGroup,
      gender: card.resolved.gender,
      ageGroup: card.resolved.ageGroup,
      fit: card.resolved.fit,
      gtip: card.resolved.gtip,
      countryOfOrigin: card.resolved.countryOfOrigin,
    },
    technical: {
      fabricType: card.resolved.fabricType,
      composition: card.resolved.composition,
      weight: card.weight,
      wash: card.resolved.wash,
      print: card.resolved.print,
      embroidery: card.resolved.embroidery,
      pattern: card.pattern,
      technicalSheetRef: card.technicalSheetRef ?? '—',
      measurementChartId: card.measurementChartId ?? '—',
    },
    bom,
    colors: mapColors(card.colorAssignments),
    sizeMatrix: mapSizeMatrix(card.refs.sizeSetId),
    revisions: mapRevisions(card.revisionHistory),
    relations: (relations?.relations ?? []).map((r) => ({
      id: r.id,
      type: r.toType,
      label: r.label,
      kind: r.kind,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      fileName: d.fileName,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.uploadedAt,
    })),
    timeline: timeline.map((t) => ({
      id: t.id,
      occurredAt: t.occurredAt,
      actor: t.actor,
      action: t.action,
      reason: t.reason,
    })),
    operationRouteCount: relations?.operationRouteIds.length ?? 0,
    qualityPlanId: relations?.qualityPlanId ?? '—',
  }
}

export function mapProductCardKpis(): ProductCardKpisDto {
  const cards = queryProductCards()
  const approved = cards.filter((c) => c.status === 'Approved').length
  const inProduction = cards.filter((c) => c.status === 'In Production').length
  const sizeSetCount = sizeSetRepository.getActive().length

  return {
    items: [
      { label: 'Ürün Kartı', value: String(cards.length), hint: 'Tanımlı' },
      { label: 'Onaylı', value: String(approved), hint: 'Üretime hazır' },
      { label: 'Üretimde', value: String(inProduction), hint: 'Aktif' },
      { label: 'Beden Seti', value: String(sizeSetCount), hint: 'Tanımlı set' },
    ],
  }
}

export function mapProductCardList(): ProductCardListItemDto[] {
  return queryProductCards().map(mapProductCardListItem)
}

export function mapProductCardEditForm(id: string): ProductCardEditDto | null {
  const card = queryProductCard(id)
  if (!card) return null
  return {
    id: card.id,
    version: queryProductCardAggregateVersion(card.id),
    lifecycleStatus: card.status,
    editable: isProductCardEditable(card.status),
    productCode: card.productCode,
    productName: card.productName,
    customerModelNo: card.customerModelNo,
    internalModelNo: card.internalModelNo,
    pattern: card.pattern,
    weight: card.weight,
    description: card.description,
    customerId: card.refs.customerId,
    brandId: card.refs.brandId,
    seasonId: card.refs.seasonId,
    sizeSetId: card.refs.sizeSetId,
  }
}

export function mapApprovedProductCardOptions() {
  return queryProductCards()
    .filter((c) => c.status === 'Approved')
    .map((c) => ({
      id: c.id,
      productCode: c.productCode,
      productName: c.productName,
      customer: c.resolved.customer,
      brand: c.resolved.brand,
      season: c.resolved.season,
      label: `${c.productCode} — ${c.productName}`,
    }))
}
