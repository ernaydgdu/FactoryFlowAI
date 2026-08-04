import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import {
  queryBomByProductId,
  queryBomEntityRevisions,
  queryBomVersion,
} from '@/domain/bom/bom-crud.service'
import { isBomEditable, isBomReadOnly } from '@/domain/bom/bom-lifecycle.types'
import { normalizeBillOfMaterials, calculateBomRequirement, validateBom } from '@/domain/services/textile/bom-service'
import { queryAllStockCards, queryStockCardById } from '@/domain/stock-card/stock-card-query.service'

import type {
  BomDesignerLineDto,
  BomDesignerViewDto,
  BomEntityRevisionDto,
  BomRevisionHistoryDto,
  StockCardOptionDto,
} from './bom-designer.dto'
import { bomLifecycleLabel } from './bom-designer.dto'

const DEFAULT_ORDER_QTY = 1000

export function mapStockCardOptions(): StockCardOptionDto[] {
  return queryAllStockCards().map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    category: c.category,
    unit: c.unit,
    label: `${c.code} — ${c.name} (${c.unit})`,
  }))
}

export function mapBomDesigner(productId: string, orderQty = DEFAULT_ORDER_QTY): BomDesignerViewDto | null {
  const card = queryProductCardById(productId)
  if (!card) return null

  const bom = normalizeBillOfMaterials(queryBomByProductId(productId) ?? card.bom)
  const validation = validateBom(bom)
  const requirements = calculateBomRequirement(bom, orderQty)
  const entityRevisions = queryBomEntityRevisions(productId)

  const lines: BomDesignerLineDto[] = requirements.map((l) => {
    const alt = l.alternativeStockCardId ? queryStockCardById(l.alternativeStockCardId) : undefined
    return {
      id: l.id,
      stockCardId: l.stockCardId,
      materialCode: l.materialCode,
      materialName: l.materialName,
      category: l.category,
      unit: l.unit,
      consumption: l.consumption,
      wastePercent: l.wastePercent,
      actualConsumption: l.actualConsumption,
      grossRequired: l.grossRequired,
      netRequired: l.netRequired,
      warehouseCode: l.warehouseCode,
      alternativeStockCardId: l.alternativeStockCardId,
      alternativeMaterialCode: alt?.code,
      notes: l.notes,
      requirement: l.requirement,
      valid: { label: l.requirement, tone: l.requirement === 'Zorunlu' ? 'default' : 'muted' },
    }
  })

  const revisionHistory: BomRevisionHistoryDto[] = bom.revisionHistory.map((r) => ({
    revisionNo: r.revisionNo,
    status: bomLifecycleLabel(r.status),
    changedAt: r.changedAt,
    changedBy: r.changedById,
    changeNote: r.changeNote,
    lineCount: r.lineCount,
    entityRevisionId: r.entityRevisionId,
  }))

  const entityRevisionDtos: BomEntityRevisionDto[] = entityRevisions.map((r) => {
    const payload = r.payload as { lines?: unknown[] }
    return {
      id: r.id,
      revisionNo: r.revision.revisionNo,
      status: r.revision.status,
      version: r.revision.version,
      reasonOfChange: r.revision.reasonOfChange ?? '',
      createdBy: r.revision.createdBy,
      createdAt: r.revision.createdAt,
      lineCount: Array.isArray(payload.lines) ? payload.lines.length : 0,
    }
  })

  return {
    productId: card.id,
    productCode: card.productCode,
    productName: card.productName,
    bomId: bom.id,
    revisionNo: bom.revisionNo,
    lifecycleStatus: bom.status,
    productVersion: queryBomVersion(productId),
    editable: isBomEditable(bom.status),
    readOnly: isBomReadOnly(bom.status),
    lineCount: lines.length,
    validationErrors: validation.errors,
    isValid: validation.valid,
    lines,
    revisionHistory,
    entityRevisions: entityRevisionDtos,
    activeRevisionRecordId: bom.activeRevisionRecordId,
    orderQty,
  }
}

export function mapBomRevisionCompare(
  productId: string,
  revisionRecordId: string,
): { current: BomDesignerLineDto[]; compared: Array<{ stockCardId: string; consumption: number; wastePercent: number; notes?: string }> } | null {
  const view = mapBomDesigner(productId)
  if (!view) return null
  const revisions = queryBomEntityRevisions(productId)
  const record = revisions.find((r) => r.id === revisionRecordId)
  if (!record) return null
  const payload = record.payload as {
    lines?: Array<{ stockCardId: string; consumption: number; wastePercent: number; notes?: string }>
  }
  return {
    current: view.lines,
    compared: payload.lines ?? [],
  }
}
