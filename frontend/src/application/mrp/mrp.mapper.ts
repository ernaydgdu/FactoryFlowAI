import { queryLatestMrpRun, queryMrpRunVersion } from '@/domain/mrp/mrp-query.service'
import type { MrpSnapshotLine } from '@/domain/mrp/mrp.types'

import type {
  MrpDashboardDto,
  MrpExceptionDto,
  MrpKpisDto,
  MrpLineItemDto,
  MrpProductionGroupDto,
  MrpProductionSuggestionDto,
  MrpProductConsolidationDto,
  MrpPurchaseGroupDto,
  MrpPurchaseSuggestionDto,
  MrpRunSummaryDto,
} from './mrp.dto'
import type { StatusBadgeDto } from '../core/types'

function mrpStatus(status: string): StatusBadgeDto {
  if (status === 'Released' || status === 'Converted') return { label: status, tone: 'success' }
  if (status === 'Approved') return { label: status, tone: 'default' }
  if (status === 'Calculated' || status === 'Pending') return { label: status, tone: 'warning' }
  if (status === 'Archived') return { label: status, tone: 'muted' }
  return { label: status, tone: 'muted' }
}

function mapLine(line: MrpSnapshotLine, idx: number): MrpLineItemDto {
  const tone = line.netShortage > 0 ? 'danger' : line.netShortage === 0 ? 'success' : 'default'
  const variantCount = line.orderBreakdown.reduce((s, o) => s + o.variantCount, 0)
  return {
    id: `${line.stockCardId}-${idx}`,
    stockCardId: line.stockCardId,
    materialCode: line.materialCode,
    materialName: line.materialName,
    category: line.category,
    grossRequirement: line.grossRequirement,
    netRequirement: line.netRequirement,
    availableStock: line.availableStock,
    reservedStock: line.reservedStock,
    openPurchaseQty: line.openPurchaseQty,
    openProductionQty: line.openProductionQty,
    netShortage: line.netShortage,
    purchaseRequirement: line.purchaseRequirement,
    productionRequirement: line.productionRequirement,
    unit: line.unit,
    supplier: line.suggestedSupplier,
    leadTimeDays: line.leadTime.totalDays,
    supplierLeadDays: line.leadTime.supplierDays,
    productionLeadDays: line.leadTime.productionDays,
    transitLeadDays: line.leadTime.transitDays,
    minStock: line.safetyStock.minStock,
    maxStock: line.safetyStock.maxStock,
    reorderPoint: line.safetyStock.reorderPoint,
    fabricLotCount: line.fabricLots.length,
    orderCount: line.orderBreakdown.length,
    variantCount,
    exceptionCount: line.exceptionMessages.length,
    status: { label: line.netShortage > 0 ? 'Eksik' : 'Karşılandı', tone },
  }
}

function mapRunSummary(): MrpRunSummaryDto | null {
  const run = queryLatestMrpRun()
  if (!run) return null
  const shortageCount = run.currentSnapshot.lines.filter((l) => l.netShortage > 0).length
  return {
    id: run.id,
    runNo: run.runNo,
    status: mrpStatus(run.status),
    revisionNo: run.currentSnapshot.revisionNo,
    generatedAt: run.currentSnapshot.generatedAt,
    openOrderCount: run.currentSnapshot.openOrderCount,
    lineCount: run.currentSnapshot.lines.length,
    variantCount: run.currentSnapshot.variantDemands.length,
    shortageCount,
    version: queryMrpRunVersion(run.id),
  }
}

export function mapMrpDashboard(): MrpDashboardDto {
  const run = queryLatestMrpRun()
  if (!run) {
    return {
      run: null,
      lines: [],
      purchaseSuggestions: [],
      purchaseGroups: [],
      productionSuggestions: [],
      productionGroups: [],
      productConsolidations: [],
      exceptions: [],
      inventoryCoverage: { covered: 0, total: 0, percent: 0 },
    }
  }

  const snapshot = run.currentSnapshot
  const lines = snapshot.lines.map(mapLine)
  const covered = lines.filter((l) => l.netShortage === 0).length
  const total = lines.length

  const purchaseSuggestions: MrpPurchaseSuggestionDto[] = snapshot.purchaseSuggestions.map((s) => ({
    id: s.id,
    materialCode: s.materialCode,
    materialName: s.materialName,
    quantity: s.quantity,
    unit: s.unit,
    supplier: s.supplier,
    requiredDate: s.requiredDate,
    leadTimeDays: s.leadTime.totalDays,
    status: mrpStatus(s.status),
  }))

  const purchaseGroups: MrpPurchaseGroupDto[] = snapshot.purchaseProposalGroups.map((g) => ({
    supplier: g.supplier,
    totalQuantity: g.totalQuantity,
    lineCount: g.lineCount,
    earliestRequiredDate: g.earliestRequiredDate,
  }))

  const productionSuggestions: MrpProductionSuggestionDto[] = snapshot.productionSuggestions.map((s) => ({
    id: s.id,
    salesOrderId: s.salesOrderId,
    orderNo: s.orderNo,
    productCode: s.productCode,
    quantity: s.quantity,
    workshopCode: s.workshopCode,
    workshopName: s.workshopName,
    productionLineCode: s.productionLineCode,
    capacityPerDay: s.capacityPerDay,
    requiredDate: s.requiredDate,
    status: mrpStatus(s.status),
  }))

  const productionGroups: MrpProductionGroupDto[] = snapshot.productionProposalGroups.map((g) => ({
    workshopCode: g.workshopCode,
    workshopName: g.workshopName,
    productionLineCode: g.productionLineCode,
    capacityPerDay: g.capacityPerDay,
    allocatedQty: g.allocatedQty,
    utilizationPercent: g.utilizationPercent,
  }))

  const productConsolidations: MrpProductConsolidationDto[] = snapshot.productConsolidations.map((c) => ({
    productCode: c.productCode,
    productName: c.productName,
    totalQuantity: c.totalQuantity,
    orderCount: c.orderCount,
    orderNos: c.orders.map((o) => o.orderNo),
  }))

  const exceptions: MrpExceptionDto[] = snapshot.exceptions.map((e) => ({
    code: e.code,
    message: e.message,
    entityRef: e.entityRef,
    severity: e.severity,
  }))

  return {
    run: mapRunSummary(),
    lines,
    purchaseSuggestions,
    purchaseGroups,
    productionSuggestions,
    productionGroups,
    productConsolidations,
    exceptions,
    inventoryCoverage: {
      covered,
      total,
      percent: total > 0 ? Math.round((covered / total) * 100) : 100,
    },
  }
}

export function mapMrpList(): MrpLineItemDto[] {
  return mapMrpDashboard().lines
}

export function mapMrpKpis(): MrpKpisDto {
  const dashboard = mapMrpDashboard()
  const run = dashboard.run
  const shortages = dashboard.lines.filter((l) => l.netShortage > 0)
  return {
    items: [
      { label: 'MRP Çalıştırması', value: run?.runNo ?? '—', hint: run?.status.label ?? 'Yok' },
      { label: 'Varyant Satırı', value: String(run?.variantCount ?? 0), hint: 'Renk×Beden' },
      { label: 'Eksik Malzeme', value: String(shortages.length), hint: 'Net ihtiyaç' },
      {
        label: 'Stok Karşılama',
        value: `${dashboard.inventoryCoverage.percent}%`,
        hint: `${dashboard.inventoryCoverage.covered}/${dashboard.inventoryCoverage.total}`,
      },
    ],
  }
}

export function mapMrpShortages(): MrpLineItemDto[] {
  return mapMrpDashboard().lines.filter((l) => l.netShortage > 0)
}
