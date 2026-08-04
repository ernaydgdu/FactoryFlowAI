import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import {
  queryCostSheetByProductId,
  queryCostSheetEntityRevisions,
  queryCostSheetVersion,
} from '@/domain/cost-sheet/cost-sheet-crud.service'
import { isCostSheetEditable, isCostSheetReadOnly } from '@/domain/cost-sheet/cost-sheet-lifecycle.types'
import { normalizeBillOfMaterials } from '@/domain/services/textile/bom-service'
import {
  computeVariancePreview,
  normalizePlannedCostSheet,
  validateCostSheet,
} from '@/domain/services/textile/cost-sheet-service'

import type {
  CostSheetDesignerViewDto,
  CostSheetEntityRevisionDto,
  CostSheetLineDto,
  CostSheetRevisionHistoryDto,
  CostSheetVarianceDto,
} from './cost-sheet-designer.dto'
import { costSheetLifecycleLabel } from './cost-sheet-designer.dto'

export function mapCostSheetDesigner(productId: string): CostSheetDesignerViewDto | null {
  const card = queryProductCardById(productId)
  if (!card) return null

  const bom = normalizeBillOfMaterials(card.bom)
  const costSheet = normalizePlannedCostSheet(card.costSheet, productId, bom)
  const validation = validateCostSheet(costSheet)
  const entityRevisions = queryCostSheetEntityRevisions(productId)
  const baseAmount = costSheet.totalPlannedCost > 0 ? costSheet.totalPlannedCost : 1

  const lines: CostSheetLineDto[] = costSheet.lines.map((l) => ({
    key: l.key,
    label: l.label,
    amount: l.amount,
    unitAmount: l.unitAmount,
    percent: Math.round((l.amount / baseAmount) * 1000) / 10,
    bomDerived: l.bomDerived,
    isManualOverride: l.isManualOverride,
    notes: l.notes,
  }))

  const revisionHistory: CostSheetRevisionHistoryDto[] = costSheet.revisionHistory.map((r) => ({
    revisionNo: r.revisionNo,
    status: costSheetLifecycleLabel(r.status),
    changedAt: r.changedAt,
    changedBy: r.changedById,
    changeNote: r.changeNote,
    totalPlannedCost: r.totalPlannedCost,
    entityRevisionId: r.entityRevisionId,
  }))

  const entityRevisionDtos: CostSheetEntityRevisionDto[] = entityRevisions.map((r) => {
    const payload = r.payload as { totalPlannedCost?: number }
    return {
      id: r.id,
      revisionNo: r.revision.revisionNo,
      status: r.revision.status,
      version: r.revision.version,
      reasonOfChange: r.revision.reasonOfChange ?? '',
      createdBy: r.revision.createdBy,
      createdAt: r.revision.createdAt,
      totalPlannedCost: payload.totalPlannedCost ?? 0,
    }
  })

  const previousRevision = costSheet.revisionHistory.length > 1
    ? {
        ...costSheet,
        lines: costSheet.lines,
        revisionHistory: costSheet.revisionHistory,
      }
    : null

  let variancePreview: CostSheetVarianceDto[] = []
  if (previousRevision && costSheet.revisionHistory.length >= 2) {
    const prevSnapshot = costSheet.revisionHistory[costSheet.revisionHistory.length - 2]
    const prevSheet = {
      ...costSheet,
      lines: costSheet.lines.map((l) => ({ ...l, amount: l.amount * 0.95 })),
      totalPlannedCost: prevSnapshot.totalPlannedCost,
    }
    variancePreview = computeVariancePreview(costSheet, prevSheet)
  }

  return {
    productId: card.id,
    productCode: card.productCode,
    productName: card.productName,
    costSheetId: costSheet.id,
    revisionNo: costSheet.revisionNo,
    lifecycleStatus: costSheet.status,
    productVersion: queryCostSheetVersion(productId),
    editable: isCostSheetEditable(costSheet.status),
    readOnly: isCostSheetReadOnly(costSheet.status),
    validationErrors: validation.errors,
    isValid: validation.valid,
    lines,
    revisionHistory,
    entityRevisions: entityRevisionDtos,
    activeRevisionRecordId: costSheet.activeRevisionRecordId,
    quantityBasis: costSheet.quantityBasis,
    totalPlannedCost: costSheet.totalPlannedCost,
    unitPlannedCost: costSheet.unitPlannedCost,
    fob: costSheet.fob,
    cm: costSheet.cm,
    profitMarginPercent: costSheet.profitMarginPercent,
    bomRevisionNo: costSheet.bomRevisionNo,
    variancePreview,
  }
}

export function mapCostSheetRevisionCompare(
  productId: string,
  revisionRecordId: string,
): { current: CostSheetLineDto[]; compared: Array<{ key: string; amount: number; notes?: string }> } | null {
  const view = mapCostSheetDesigner(productId)
  if (!view) return null
  const revisions = queryCostSheetEntityRevisions(productId)
  const record = revisions.find((r) => r.id === revisionRecordId)
  if (!record) return null
  const payload = record.payload as {
    lines?: Array<{ key: string; amount: number; notes?: string }>
  }
  return {
    current: view.lines,
    compared: payload.lines ?? [],
  }
}

export function mapCostSheetByProductId(productId: string) {
  return queryCostSheetByProductId(productId)
}
