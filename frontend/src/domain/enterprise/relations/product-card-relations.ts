/**
 * Product Card enterprise relations — mevcut textile servislerinden okur
 */
import { getTextileProductById } from '../../data/products'
import { deriveProductFromTemplate } from '../../master-data/enterprise/template-service'
import { resolveDefaultsForProductGroup } from '../../master-data/enterprise/default-resolver-service'
import type { EntityRelation, ProductCardRelations } from '../types'

function rel(
  fromId: string,
  toType: EntityRelation['toType'],
  toId: string,
  kind: EntityRelation['kind'],
  label: string,
): EntityRelation {
  return {
    id: `rel-pc-${fromId}-${toType}-${toId}`,
    fromType: 'PRODUCT_CARD',
    fromId,
    toType,
    toId,
    kind,
    label,
  }
}

export function buildProductCardRelations(productCardId: string): ProductCardRelations | undefined {
  const card = getTextileProductById(productCardId)
  if (!card) return undefined

  const relations: EntityRelation[] = []
  const defaults = resolveDefaultsForProductGroup(card.refs.productGroupId)

  relations.push(rel(productCardId, 'BOM', card.bom.id, 'HAS', 'Bill of Materials'))
  relations.push(rel(productCardId, 'SIZE_SET', card.refs.sizeSetId, 'HAS', 'Default Size Set'))

  for (const ca of card.colorAssignments) {
    relations.push(rel(productCardId, 'COLOR_CARD', ca.colorCardId, 'HAS', 'Color Assignment'))
  }

  if (card.measurementChartId) {
    relations.push(rel(productCardId, 'MEASUREMENT_TABLE', card.measurementChartId, 'HAS', 'Measurement Table'))
  }
  if (card.technicalSheetRef) {
    relations.push(rel(productCardId, 'TECHNICAL_SHEET', card.technicalSheetRef, 'HAS', 'Technical Sheet'))
  }

  for (const rev of card.revisionHistory) {
    relations.push(rel(productCardId, 'PRODUCT_CARD', `${productCardId}-rev-${rev.revisionNo}`, 'REFERENCES', `Revision ${rev.revisionNo}`))
  }

  const routeIds = defaults.operationRouteIds ?? []
  for (const opId of routeIds) {
    relations.push(rel(productCardId, 'OPERATION_ROUTE', opId, 'ROUTES_TO', 'Operation Route'))
  }

  const templateCode = card.refs.productGroupId === 'pg-tshirt' ? 'TPL-TSHIRT' : undefined
  let productionTemplateId: string | undefined
  if (templateCode) {
    const derived = deriveProductFromTemplate(templateCode)
    productionTemplateId = derived.templateId
    relations.push(rel(productCardId, 'PRODUCT_CARD', derived.templateId, 'DERIVED_FROM', 'Production Template'))
  }

  const qualityPlanId = `qip-${card.refs.productGroupId.replace('pg-', '')}`
  relations.push(rel(productCardId, 'QUALITY_PLAN', qualityPlanId, 'HAS', 'Quality Plan'))

  const costSheetId = card.costSheet?.id ?? `cost-pc-${productCardId}`
  relations.push(rel(productCardId, 'COST_SHEET', costSheetId, 'HAS', 'Cost Sheet'))

  relations.push(rel(productCardId, 'SAMPLE', `sample-${productCardId}`, 'REFERENCES', 'Sample History'))

  return {
    rootType: 'PRODUCT_CARD',
    rootId: productCardId,
    rootCode: card.productCode,
    rootLabel: card.productName,
    relations,
    maxDepth: 2,
    bomId: card.bom.id,
    operationRouteIds: routeIds,
    sizeSetId: card.refs.sizeSetId,
    defaultColorCardIds: card.colorAssignments.map((c) => c.colorCardId),
    measurementChartId: card.measurementChartId,
    technicalSheetRef: card.technicalSheetRef,
    costSheetId,
    qualityPlanId,
    productionTemplateId,
  }
}

export function buildAllProductCardRelations(): ProductCardRelations[] {
  return Array.from({ length: 24 }, (_, i) => buildProductCardRelations(String(i + 1))).filter(
    (b): b is ProductCardRelations => !!b,
  )
}
