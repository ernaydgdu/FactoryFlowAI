/**
 * BOM Service — gerçek üretim reçetesi hesaplamaları.
 */
import type { BomLine } from '../../types'
import type { BomLineDetail, BillOfMaterials } from '../../types/textile-erp'
import { getStockCardById } from '../../data/stock-cards'
import { supplierRepository, warehouseRepository } from '../../master-data'
import { calcActualConsumption } from '../calculations'

export function enrichBomLine(line: Omit<BomLine, 'actualConsumption'> & Partial<BomLine>): BomLineDetail {
  const card = getStockCardById(line.stockCardId)
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
): BillOfMaterials {
  return {
    id: `bom-${productCardId}-r${revisionNo}`,
    productCardId,
    revisionNo,
    lines: lines.map(enrichBomLine),
    generatedAt: new Date().toISOString(),
  }
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
    if (!warehouseRepository.getByCode(line.warehouseCode) && line.warehouseCode) {
      errors.push(`Depo bulunamadı: ${line.warehouseCode}`)
    }
  }
  return { valid: errors.length === 0, errors }
}
