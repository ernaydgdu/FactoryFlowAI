/**
 * Fabric Management — profesyonel kumaş kartları.
 */
import { getStockCardsByCategory, getStockCardById } from '../../data/stock-cards'
import {
  fabricCompositionRepository,
  fabricTypeRepository,
  supplierRepository,
} from '../../master-data'
import type { FabricCard } from '../../types/textile-erp'

function parseHexWeight(attrs: Record<string, string | number>, fallback: number): number {
  return typeof attrs.weightGsm === 'number' ? attrs.weightGsm : fallback
}

export function toFabricCard(stockCardId: string): FabricCard | undefined {
  const card = getStockCardById(stockCardId)
  if (!card || card.category !== 'Kumaş') return undefined

  const supplier = supplierRepository.find((s) => s.name === card.supplier)[0]
  const ft = fabricTypeRepository.getActive().find((f) => card.name.toLowerCase().includes(f.name.toLowerCase().split(' ')[0]))
  const fc = fabricCompositionRepository.getActive()[0]

  return {
    id: `fabric-${card.id}`,
    stockCardId: card.id,
    code: card.code,
    name: card.name,
    fabricTypeId: ft?.id ?? fabricTypeRepository.getActive()[0]?.id ?? '',
    compositionId: fc?.id ?? '',
    weightGsm: parseHexWeight(card.attributes, 280),
    widthCm: typeof card.attributes.width === 'number' ? card.attributes.width : 150,
    shrinkagePercent: typeof card.attributes.shrinkage === 'number' ? card.attributes.shrinkage : 3,
    lycraPercent: typeof card.attributes.lycra === 'number' ? card.attributes.lycra : 2,
    lot: card.lot,
    rollNo: String(card.attributes.rollNo ?? ''),
    batchNo: String(card.attributes.batchNo ?? ''),
    qualityGrade: 'A',
    supplierId: supplier?.id ?? '',
    warehouseCode: card.warehouseCode,
    leadTimeDays: card.leadTimeDays,
    unit: card.unit,
  }
}

export function getAllFabricCards(): FabricCard[] {
  return getStockCardsByCategory('Kumaş')
    .map((c) => toFabricCard(c.id))
    .filter((f): f is FabricCard => !!f)
}

export function getMainFabricForProduct(mainFabricStockCardId: string): FabricCard | undefined {
  return toFabricCard(mainFabricStockCardId)
}
