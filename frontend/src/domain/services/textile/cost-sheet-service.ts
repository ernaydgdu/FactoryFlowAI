/**
 * Planned Cost Sheet — BOM + Stock Card repository üzerinden maliyet hesaplama.
 */
import { queryStockCardById } from '../../stock-card/stock-card-query.service'
import type {
  BillOfMaterials,
  CostSheetLifecycleStatus,
  CostSheetLineItem,
  CostSheetLineKey,
  CostSheetRevisionSnapshot,
  PlannedCostSheet,
} from '../../types/textile-erp'

export const COST_SHEET_LINE_DEFINITIONS: Array<{
  key: CostSheetLineKey
  label: string
  bomDerived: boolean
}> = [
  { key: 'fabric', label: 'Kumaş', bomDerived: true },
  { key: 'accessory', label: 'Aksesuar', bomDerived: true },
  { key: 'thread', label: 'İplik', bomDerived: true },
  { key: 'print', label: 'Baskı', bomDerived: false },
  { key: 'embroidery', label: 'Nakış', bomDerived: false },
  { key: 'washing', label: 'Yıkama', bomDerived: false },
  { key: 'cutting', label: 'Kesim', bomDerived: false },
  { key: 'sewing', label: 'Dikim', bomDerived: false },
  { key: 'ironing', label: 'Ütü', bomDerived: false },
  { key: 'packaging', label: 'Paketleme', bomDerived: true },
  { key: 'waste', label: 'Fire', bomDerived: true },
  { key: 'logistics', label: 'Lojistik', bomDerived: false },
  { key: 'overhead', label: 'Genel Gider', bomDerived: false },
  { key: 'profitMargin', label: 'Kar Marjı', bomDerived: false },
]

const BOM_DERIVED_KEYS = new Set(
  COST_SHEET_LINE_DEFINITIONS.filter((d) => d.bomDerived).map((d) => d.key),
)

export function getStockUnitPrice(stockCardId: string): number {
  const card = queryStockCardById(stockCardId)
  if (!card) return 0
  const price = card.attributes.unitPrice
  return typeof price === 'number' ? price : 0
}

export function calculateBomDerivedAmounts(bom: BillOfMaterials): Record<CostSheetLineKey, number> {
  const amounts = Object.fromEntries(
    COST_SHEET_LINE_DEFINITIONS.map((d) => [d.key, 0]),
  ) as Record<CostSheetLineKey, number>

  for (const line of bom.lines) {
    const unitPrice = getStockUnitPrice(line.stockCardId)
    const lineCost = Math.round(line.actualConsumption * unitPrice * 100) / 100
    const wasteCost = Math.round(lineCost * (line.wastePercent / 100) * 100) / 100
    amounts.waste += wasteCost

    if (line.category === 'Kumaş' || line.category === 'Tela') {
      amounts.fabric += lineCost
    } else if (line.category === 'İplik') {
      amounts.thread += lineCost
    } else if (line.category === 'Poşet' || line.category === 'Karton' || line.category === 'Koli') {
      amounts.packaging += lineCost
    } else {
      amounts.accessory += lineCost
    }
  }

  for (const key of BOM_DERIVED_KEYS) {
    amounts[key] = Math.round(amounts[key] * 100) / 100
  }
  return amounts
}

export type CostSheetLineInput = {
  key: CostSheetLineKey
  amount: number
  isManualOverride?: boolean
  notes?: string
}

function defaultLines(bomAmounts?: Record<CostSheetLineKey, number>): CostSheetLineItem[] {
  return COST_SHEET_LINE_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    amount: bomAmounts?.[def.key] ?? 0,
    unitAmount: bomAmounts?.[def.key] ?? 0,
    bomDerived: def.bomDerived,
    isManualOverride: false,
  }))
}

function computeTotals(lines: CostSheetLineItem[], quantityBasis: number): {
  totalPlannedCost: number
  unitPlannedCost: number
  fob: number
  cm: number
  profitMarginPercent: number
} {
  const qty = quantityBasis > 0 ? quantityBasis : 1
  const processKeys: CostSheetLineKey[] = ['cutting', 'sewing', 'ironing', 'washing', 'print', 'embroidery']
  const cm = Math.round(
    processKeys.reduce((s, k) => s + (lines.find((l) => l.key === k)?.amount ?? 0), 0) * 100,
  ) / 100
  const materialAndOverhead = lines
    .filter((l) => l.key !== 'profitMargin' && !processKeys.includes(l.key))
    .reduce((s, l) => s + l.amount, 0)
  const profit = lines.find((l) => l.key === 'profitMargin')?.amount ?? 0
  const totalPlannedCost = Math.round((materialAndOverhead + cm + profit) * 100) / 100
  const fob = totalPlannedCost
  const base = totalPlannedCost - profit
  const profitMarginPercent = base > 0 ? Math.round((profit / base) * 1000) / 10 : 0
  return {
    totalPlannedCost,
    unitPlannedCost: Math.round((totalPlannedCost / qty) * 100) / 100,
    fob,
    cm,
    profitMarginPercent,
  }
}

export function buildPlannedCostSheet(
  productCardId: string,
  bom: BillOfMaterials,
  revisionNo = 1,
  status: CostSheetLifecycleStatus = 'Draft',
  actorUserId = 'system',
  changeNote = 'Maliyet çizelgesi oluşturuldu',
  lineOverrides?: CostSheetLineInput[],
  quantityBasis = 1,
): PlannedCostSheet {
  const now = new Date().toISOString()
  const bomAmounts = calculateBomDerivedAmounts(bom)
  let lines = defaultLines(bomAmounts)

  if (lineOverrides) {
    lines = mergeCostSheetLines(lines, lineOverrides, bomAmounts)
  }

  lines = lines.map((l) => ({
    ...l,
    unitAmount: Math.round((l.amount / (quantityBasis > 0 ? quantityBasis : 1)) * 100) / 100,
  }))

  const totals = computeTotals(lines, quantityBasis)
  const snapshot: CostSheetRevisionSnapshot = {
    revisionNo,
    status,
    changedAt: now,
    changedById: actorUserId,
    changeNote,
    totalPlannedCost: totals.totalPlannedCost,
  }

  return {
    id: `cost-${productCardId}-r${revisionNo}`,
    productCardId,
    revisionNo,
    status,
    lines,
    quantityBasis,
    ...totals,
    generatedAt: now,
    revisionHistory: [snapshot],
    bomRevisionNo: bom.revisionNo,
  }
}

export function mergeCostSheetLines(
  existing: CostSheetLineItem[],
  inputs: CostSheetLineInput[],
  bomAmounts: Record<CostSheetLineKey, number>,
): CostSheetLineItem[] {
  const inputMap = new Map(inputs.map((i) => [i.key, i]))
  return existing.map((line) => {
    const input = inputMap.get(line.key)
    if (input) {
      const manual = input.isManualOverride ?? !line.bomDerived
      return {
        ...line,
        amount: input.amount,
        isManualOverride: manual,
        notes: input.notes ?? line.notes,
      }
    }
    if (line.bomDerived && !line.isManualOverride) {
      return { ...line, amount: bomAmounts[line.key] ?? line.amount }
    }
    return line
  })
}

export function recalculatePlannedCostFromBom(
  costSheet: PlannedCostSheet,
  bom: BillOfMaterials,
): PlannedCostSheet {
  const bomAmounts = calculateBomDerivedAmounts(bom)
  const lines = costSheet.lines.map((line) => {
    if (line.bomDerived && !line.isManualOverride) {
      const amount = bomAmounts[line.key] ?? line.amount
      return {
        ...line,
        amount,
        unitAmount: Math.round((amount / (costSheet.quantityBasis || 1)) * 100) / 100,
      }
    }
    return line
  })
  const totals = computeTotals(lines, costSheet.quantityBasis)
  return {
    ...costSheet,
    lines,
    ...totals,
    generatedAt: new Date().toISOString(),
    bomRevisionNo: bom.revisionNo,
  }
}

export function normalizePlannedCostSheet(
  costSheet: PlannedCostSheet | undefined,
  productCardId: string,
  bom: BillOfMaterials,
): PlannedCostSheet {
  if (!costSheet) {
    return buildPlannedCostSheet(productCardId, bom, 1, 'Draft')
  }
  const status = costSheet.status ?? 'Draft'
  const revisionHistory =
    costSheet.revisionHistory?.length > 0
      ? costSheet.revisionHistory
      : [
          {
            revisionNo: costSheet.revisionNo,
            status,
            changedAt: costSheet.generatedAt,
            changedById: 'system',
            changeNote: 'Legacy cost sheet',
            totalPlannedCost: costSheet.totalPlannedCost,
          },
        ]
  const lines =
    costSheet.lines?.length === COST_SHEET_LINE_DEFINITIONS.length
      ? costSheet.lines
      : defaultLines(calculateBomDerivedAmounts(bom))
  const totals = computeTotals(lines, costSheet.quantityBasis ?? 1)
  return { ...costSheet, status, revisionHistory, lines, ...totals }
}

export function enrichCostSheetLines(
  costSheet: PlannedCostSheet,
  bom: BillOfMaterials,
  inputs: CostSheetLineInput[],
  quantityBasis?: number,
): PlannedCostSheet {
  const bomAmounts = calculateBomDerivedAmounts(bom)
  const qty = quantityBasis ?? costSheet.quantityBasis
  const lines = mergeCostSheetLines(costSheet.lines, inputs, bomAmounts).map((l) => ({
    ...l,
    unitAmount: Math.round((l.amount / (qty > 0 ? qty : 1)) * 100) / 100,
  }))
  const totals = computeTotals(lines, qty)
  return {
    ...costSheet,
    lines,
    quantityBasis: qty,
    ...totals,
    generatedAt: new Date().toISOString(),
    bomRevisionNo: bom.revisionNo,
  }
}

export function validateCostSheet(costSheet: PlannedCostSheet): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (costSheet.lines.length === 0) errors.push('Maliyet çizelgesi en az bir kalem içermeli')
  if (costSheet.totalPlannedCost <= 0) errors.push('Toplam planlanan maliyet sıfırdan büyük olmalı')
  const fabric = costSheet.lines.find((l) => l.key === 'fabric')
  if (!fabric || fabric.amount <= 0) errors.push('Kumaş maliyeti zorunlu')
  return { valid: errors.length === 0, errors }
}

export function computeVariancePreview(
  current: PlannedCostSheet,
  previous: PlannedCostSheet,
): Array<{ key: CostSheetLineKey; label: string; current: number; previous: number; delta: number; deltaPercent: number }> {
  return current.lines.map((line) => {
    const prev = previous.lines.find((l) => l.key === line.key)
    const previousAmount = prev?.amount ?? 0
    const delta = Math.round((line.amount - previousAmount) * 100) / 100
    const deltaPercent =
      previousAmount > 0 ? Math.round((delta / previousAmount) * 1000) / 10 : line.amount > 0 ? 100 : 0
    return {
      key: line.key,
      label: line.label,
      current: line.amount,
      previous: previousAmount,
      delta,
      deltaPercent,
    }
  })
}
