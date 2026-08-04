/**
 * BOM Service — gerçek üretim reçetesi hesaplamaları.
 */
import type { BomLine } from '../../types'
import type {
  BillOfMaterials,
  BomLifecycleStatus,
  BomLineDetail,
  BomRevisionSnapshot,
} from '../../types/textile-erp'
import { queryStockCardById } from '../../stock-card/stock-card-query.service'
import { supplierRepository, warehouseRepository } from '../../master-data'
import { calcActualConsumption } from '../calculations'

export function enrichBomLine(line: Omit<BomLine, 'actualConsumption'> & Partial<BomLine>): BomLineDetail {
  const card = queryStockCardById(line.stockCardId)
  const net = line.consumption
  const actual = line.actualConsumption ?? calcActualConsumption(line.consumption, line.wastePercent)
  const supplier = card ? supplierRepository.find((s) => s.name === card.supplier)[0] : undefined

  return {
    id: line.id,
    stockCardId: line.stockCardId,
    materialCode: card?.code ?? line.stockCardId,
    materialName: card?.name ?? line.stockCardId,
    category: card?.category ?? 'Malzeme',
    unit: card?.unit ?? 'adet',
    consumption: line.consumption,
    wastePercent: line.wastePercent,
    netConsumption: net,
    actualConsumption: actual,
    alternativeStockCardId: line.alternativeStockCardId,
    warehouseCode: card?.warehouseCode ?? '',
    supplierId: supplier?.id ?? '',
    leadTimeDays: card?.leadTimeDays ?? 14,
    lotTracking: card?.category === 'Kumaş',
    requirement: 'Zorunlu',
    notes: line.notes,
  }
}

export function buildBillOfMaterials(
  productCardId: string,
  lines: BomLine[],
  revisionNo = 1,
  status: BomLifecycleStatus = 'Draft',
  actorUserId = 'system',
  changeNote = 'BOM oluşturuldu',
): BillOfMaterials {
  const now = new Date().toISOString()
  const enriched = lines.map(enrichBomLine)
  const snapshot: BomRevisionSnapshot = {
    revisionNo,
    status,
    changedAt: now,
    changedById: actorUserId,
    changeNote,
    lineCount: enriched.length,
  }
  return {
    id: `bom-${productCardId}-r${revisionNo}`,
    productCardId,
    revisionNo,
    status,
    lines: enriched,
    generatedAt: now,
    revisionHistory: [snapshot],
  }
}

export function normalizeBillOfMaterials(bom: BillOfMaterials): BillOfMaterials {
  const status = bom.status ?? 'Active'
  const revisionHistory =
    bom.revisionHistory?.length > 0
      ? bom.revisionHistory
      : [
          {
            revisionNo: bom.revisionNo,
            status,
            changedAt: bom.generatedAt,
            changedById: 'system',
            changeNote: 'Legacy BOM',
            lineCount: bom.lines.length,
          },
        ]
  return { ...bom, status, revisionHistory }
}

export function calculateBomRequirement(
  bom: BillOfMaterials,
  orderQty: number,
): Array<BomLineDetail & { grossRequired: number; netRequired: number }> {
  return bom.lines.map((line) => ({
    ...line,
    grossRequired: Math.round(orderQty * line.consumption * 100) / 100,
    netRequired: Math.round(orderQty * line.actualConsumption * 100) / 100,
  }))
}

export function toLegacyBomLines(bom: BillOfMaterials): BomLine[] {
  return bom.lines.map((l) => ({
    id: l.id,
    stockCardId: l.stockCardId,
    consumption: l.consumption,
    wastePercent: l.wastePercent,
    actualConsumption: l.actualConsumption,
    alternativeStockCardId: l.alternativeStockCardId,
    notes: l.notes,
  }))
}

export function getBomWarehouseCodes(bom: BillOfMaterials): string[] {
  return [...new Set(bom.lines.map((l) => l.warehouseCode).filter(Boolean))]
}

export function validateBom(bom: BillOfMaterials): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (bom.lines.length === 0) errors.push('BOM en az bir satır içermeli')
  const fabricLines = bom.lines.filter((l) => l.category === 'Kumaş')
  if (fabricLines.length === 0) errors.push('Ana kumaş satırı zorunlu')
  for (const line of bom.lines) {
    if (!queryStockCardById(line.stockCardId)) {
      errors.push(`Stok kartı bulunamadı: ${line.stockCardId}`)
    }
    if (!warehouseRepository.getByCode(line.warehouseCode) && line.warehouseCode) {
      errors.push(`Depo bulunamadı: ${line.warehouseCode}`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export type BomLineInput = {
  id?: string
  stockCardId: string
  consumption: number
  wastePercent: number
  alternativeStockCardId?: string
  notes?: string
  requirement?: 'Zorunlu' | 'Opsiyonel'
}

export function bomLinesFromInput(lines: BomLineInput[]): BomLine[] {
  return lines.map((line, index) => ({
    id: line.id ?? `bom-line-${Date.now()}-${index}`,
    stockCardId: line.stockCardId,
    consumption: line.consumption,
    wastePercent: line.wastePercent,
    actualConsumption: calcActualConsumption(line.consumption, line.wastePercent),
    alternativeStockCardId: line.alternativeStockCardId,
    notes: line.notes,
  }))
}

export function enrichBomLinesWithRequirement(
  bom: BillOfMaterials,
  lines: BomLineInput[],
): BillOfMaterials {
  const legacy = bomLinesFromInput(lines)
  const enriched = legacy.map(enrichBomLine)
  const withReq = enriched.map((line, i) => ({
    ...line,
    requirement: lines[i]?.requirement ?? line.requirement,
  }))
  return { ...bom, lines: withReq, generatedAt: new Date().toISOString() }
}
