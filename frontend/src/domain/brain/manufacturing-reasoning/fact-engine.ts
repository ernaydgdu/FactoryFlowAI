/**
 * Fact Engine — converts ERP read models into standardized BrainFacts.
 * Read-only. Never mutates ERP aggregates.
 */
import { queryCostClosingBrainReadModel } from '@/domain/cost-closing/cost-closing-query.service'
import { queryFinanceIntegrationBrainReadModel } from '@/domain/finance-integration/finance-integration-query.service'
import { queryAllBalances } from '@/domain/inventory/stock-ledger-query.service'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'
import { buildProductionPlanningBrainSnapshot } from '@/domain/production-planning/production-planning-query'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'
import { queryAllPurchaseOrders } from '@/domain/purchasing/purchase-order-query.service'
import { queryAllQuotations } from '@/domain/purchasing/rfq-query.service'
import { listHoldQueue, getQualityDashboardKpis } from '@/domain/quality/quality-query.service'
import { queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { queryAllShipments, queryShipmentDashboard } from '@/domain/shipment/shipment-query.service'
import { queryStyleClosingBrainReadModel } from '@/domain/style-closing/style-closing-query.service'

import type { BrainFact, FactContext, FactSourceModule } from './types'

const CLOSED_PO_STATUSES = new Set(['Completed', 'Closed', 'Cancelled', 'Archived'])

function nowIso(): string {
  return new Date().toISOString()
}

export type FactCollection = {
  facts: BrainFact[]
  context: FactContext
}

export function collectManufacturingFacts(): FactCollection {
  const collectedAt = nowIso()
  const facts: BrainFact[] = []
  const context: FactContext = {
    fifoEnabled: true,
    maintenanceExpired: false,
    inspectionFailed: false,
    wastePct: 0,
    standardWastePct: 0.03,
    rollLength: 0,
    markerLength: 0,
  }

  const mrp = queryLatestMrpRun()
  const mrpLines = mrp?.currentSnapshot.lines ?? []
  const safetyByMaterial = new Map(
    mrpLines.map((l) => [l.materialCode, l.safetyStock.reorderPoint ?? l.safetyStock.minStock ?? 0]),
  )

  const balances = queryAllBalances()
  for (const b of balances) {
    const safety = safetyByMaterial.get(b.materialCode) ?? 0
    facts.push({
      id: `fact-inv-${b.stockCardId}-${b.warehouseCode}`,
      sourceModule: 'inventory',
      subjectType: 'InventoryBalance',
      subjectId: `${b.stockCardId}:${b.warehouseCode}`,
      label: `${b.materialName} @ ${b.warehouseCode}`,
      attributes: {
        materialCode: b.materialCode,
        materialName: b.materialName,
        warehouseCode: b.warehouseCode,
        unit: b.unit,
        onHand: b.onHand,
        reserved: b.reserved,
        available: b.available,
        safetyStock: safety,
        belowSafety: b.available < safety,
      },
      relatedConceptIds: ['c-warehouse', 'c-lot', 'c-fifo'],
      collectedAt,
    })
    facts.push({
      id: `fact-wh-${b.stockCardId}-${b.warehouseCode}`,
      sourceModule: 'warehouse',
      subjectType: 'WarehouseBalance',
      subjectId: `${b.warehouseCode}:${b.materialCode}`,
      label: `Warehouse ${b.warehouseName}`,
      attributes: {
        warehouseCode: b.warehouseCode,
        available: b.available,
        reserved: b.reserved,
        unit: b.unit,
      },
      relatedConceptIds: ['c-warehouse', 'c-receiving'],
      collectedAt,
    })
  }

  context.inventoryAvailable = balances.reduce((s, b) => s + b.available, 0)
  context.inventoryReserved = balances.reduce((s, b) => s + b.reserved, 0)
  context.inventoryBalanceCount = balances.length

  const salesOrders = queryAllSalesOrders()
  let lateOrderCount = 0
  for (const so of salesOrders) {
    if (so.terminRisk) lateOrderCount += 1
    facts.push({
      id: `fact-so-${so.id}`,
      sourceModule: 'sales-order',
      subjectType: 'SalesOrder',
      subjectId: so.id,
      label: so.orderNo,
      attributes: {
        orderNo: so.orderNo,
        status: so.status,
        terminRisk: so.terminRisk,
        customer: so.general.customer,
        fabricStatus: so.fabricStatus,
        progress: so.progress,
        exfDate: so.exfDate,
      },
      relatedConceptIds: ['c-order'],
      collectedAt,
    })
  }
  context.salesOrderCount = salesOrders.length
  context.lateOrderCount = lateOrderCount
  context.hasLateOrder = lateOrderCount > 0

  const productionOrders = queryAllProductionOrders()
  for (const po of productionOrders.slice(0, 200)) {
    const progress =
      po.plannedQty > 0 ? Math.round((po.producedQty / po.plannedQty) * 100) : 0
    facts.push({
      id: `fact-po-${po.productionOrderNo}`,
      sourceModule: 'production-order',
      subjectType: 'ProductionOrder',
      subjectId: po.productionOrderNo,
      label: po.productionOrderNo,
      attributes: {
        productionOrderNo: po.productionOrderNo,
        salesOrderId: po.salesOrderId,
        status: po.status,
        plannedQty: po.plannedQty,
        producedQty: po.producedQty,
        progress,
        workshopCode: po.workshopCode,
        terminRiskScore: po.snapshots.planning.terminRiskScore,
      },
      relatedConceptIds: ['c-sewing', 'c-cutting'],
      collectedAt,
    })
  }
  context.productionOrderCount = productionOrders.length
  context.openProduction = productionOrders.filter(
    (p) => p.status !== 'Closed' && p.status !== 'Cancelled' && p.status !== 'Completed',
  ).length

  let gross = 0
  let stock = 0
  let openPOQty = 0
  let openProductionQty = 0
  let netShortage = 0
  let lowStockLines = 0
  for (const line of mrpLines) {
    gross += line.grossRequirement
    stock += line.availableStock
    openPOQty += line.openPurchaseQty
    openProductionQty += line.openProductionQty
    netShortage += Math.max(0, line.netShortage)
    if (line.netShortage > 0 || line.availableStock < (line.safetyStock.reorderPoint ?? 0)) {
      lowStockLines += 1
    }
    facts.push({
      id: `fact-mrp-${line.stockCardId}`,
      sourceModule: 'mrp',
      subjectType: 'MrpSnapshotLine',
      subjectId: line.stockCardId,
      label: line.materialName,
      attributes: {
        materialCode: line.materialCode,
        gross: line.grossRequirement,
        stock: line.availableStock,
        openPO: line.openPurchaseQty,
        openProduction: line.openProductionQty,
        netRequirement: line.netRequirement,
        netShortage: line.netShortage,
        safetyStock: line.safetyStock.reorderPoint,
        suggestedSupplier: line.suggestedSupplier,
      },
      relatedConceptIds: ['c-mrp', 'c-purchasing', 'c-warehouse'],
      collectedAt,
    })
  }
  context.gross = gross
  context.stock = stock
  context.openPO = openPOQty
  context.openProductionQty = openProductionQty
  context.netShortage = netShortage
  context.lowStockLines = lowStockLines
  context.hasLowStock = lowStockLines > 0
  context.mrpRunPresent = mrp != null

  const purchaseOrders = queryAllPurchaseOrders()
  const openPos = purchaseOrders.filter((p) => !CLOSED_PO_STATUSES.has(p.status))
  for (const po of openPos.slice(0, 100)) {
    facts.push({
      id: `fact-pur-${po.id}`,
      sourceModule: 'purchasing',
      subjectType: 'PurchaseOrder',
      subjectId: po.id,
      label: po.poNo,
      attributes: {
        poNo: po.poNo,
        supplier: po.supplier,
        supplierCode: po.supplierCode,
        status: po.status,
        lineCount: po.lines.length,
        totalQty: po.lines.reduce((s, l) => s + l.quantity, 0),
      },
      relatedConceptIds: ['c-purchasing'],
      collectedAt,
    })
  }
  context.openPurchaseOrderCount = openPos.length

  const quotations = queryAllQuotations()
  for (const q of quotations.slice(0, 50)) {
    facts.push({
      id: `fact-quote-${q.id}`,
      sourceModule: 'purchasing',
      subjectType: 'SupplierQuotation',
      subjectId: q.id,
      label: `${q.supplierName} quote`,
      attributes: {
        supplierCode: q.supplierCode,
        supplierName: q.supplierName,
        status: q.status,
        totalPrice: q.totalAmount,
        lineCount: q.lines.length,
        avgLeadTimeDays:
          q.lines.length === 0
            ? 0
            : q.lines.reduce((s, l) => s + l.leadTimeDays, 0) / q.lines.length,
      },
      relatedConceptIds: ['c-purchasing'],
      collectedAt,
    })
  }
  context.quotationCount = quotations.length

  const holds = listHoldQueue()
  const qualityKpis = getQualityDashboardKpis()
  context.inspectionFailed = holds.length > 0
  context.qualityHoldCount = holds.length
  for (const h of holds.slice(0, 100)) {
    facts.push({
      id: `fact-qhold-${h.bundleId}`,
      sourceModule: 'quality',
      subjectType: 'QualityHold',
      subjectId: h.bundleId,
      label: `Hold ${h.bundleNo}`,
      attributes: {
        bundleNo: h.bundleNo,
        productionOrderNo: h.productionOrderNo,
        reasonCode: h.reasonCode,
        pieceCount: h.pieceCount,
        inspectionFailed: true,
      },
      relatedConceptIds: ['c-quality', 'c-aql', 'c-shipment'],
      collectedAt,
    })
  }
  facts.push({
    id: 'fact-quality-kpis',
    sourceModule: 'quality',
    subjectType: 'QualityDashboard',
    subjectId: 'quality-dashboard',
    label: 'Quality KPIs',
    attributes: {
      holdCount: holds.length,
      ncrOpen: qualityKpis.ncrOpen,
      reworkOpen: qualityKpis.reworkOpen,
      passCount: qualityKpis.passCount,
      rejectCount: qualityKpis.rejectCount,
    },
    relatedConceptIds: ['c-quality', 'c-ftt'],
    collectedAt,
  })

  const shipments = queryAllShipments()
  const shipDash = queryShipmentDashboard()
  for (const sh of shipments.slice(0, 100)) {
    facts.push({
      id: `fact-ship-${sh.id}`,
      sourceModule: 'shipment',
      subjectType: 'Shipment',
      subjectId: sh.id,
      label: sh.shipmentNo,
      attributes: {
        shipmentNo: sh.shipmentNo,
        status: sh.status,
        totalQty: sh.totals.totalQty,
        salesOrderId: sh.salesOrderId,
      },
      relatedConceptIds: ['c-shipment'],
      collectedAt,
    })
  }
  context.shipmentCount = shipDash.total
  context.shipmentInTransit = shipDash.inTransit

  const finance = queryFinanceIntegrationBrainReadModel()
  facts.push({
    id: 'fact-finance',
    sourceModule: 'finance-integration',
    subjectType: 'FinanceBrain',
    subjectId: 'finance',
    label: 'Finance integration',
    attributes: {
      queued: finance.queued,
      posted: finance.posted,
      failed: finance.failed,
      avgCostAnomalyScore: finance.avgCostAnomalyScore,
    },
    relatedConceptIds: ['c-finance'],
    collectedAt,
  })
  context.financeFailed = finance.failed
  context.financeQueued = finance.queued
  context.financeAnomaly = finance.avgCostAnomalyScore

  const cost = queryCostClosingBrainReadModel()
  facts.push({
    id: 'fact-cost-closing',
    sourceModule: 'cost-closing',
    subjectType: 'CostClosingBrain',
    subjectId: 'cost-closing',
    label: 'Cost closing',
    attributes: {
      open: cost.open,
      calculating: cost.calculating,
      reconciling: cost.reconciling,
      approved: cost.approved,
      closed: cost.closed,
      avgAnomalyScore: cost.avgAnomalyScore,
    },
    relatedConceptIds: ['c-finance', 'c-waste'],
    collectedAt,
  })

  const style = queryStyleClosingBrainReadModel()
  facts.push({
    id: 'fact-style-closing',
    sourceModule: 'style-closing',
    subjectType: 'StyleClosingBrain',
    subjectId: 'style-closing',
    label: 'Style closing',
    attributes: {
      open: style.open,
      checking: style.checking,
      ready: style.ready,
      approved: style.approved,
      closed: style.closed,
      avgAnomalyScore: style.avgAnomalyScore,
      avgMarginPercent: style.avgMarginPercent,
    },
    relatedConceptIds: ['c-finance', 'c-order'],
    collectedAt,
  })

  const planning = buildProductionPlanningBrainSnapshot()
  const wasteUnits = planning.wasteSummary.fire + planning.wasteSummary.rework + planning.wasteSummary.secondQuality
  context.wastePct = planning.orderCount > 0 ? wasteUnits / Math.max(1, planning.orderCount * 100) : 0
  context.terminRiskCount = planning.terminRiskCount
  context.hasLateOrder = Boolean(context.hasLateOrder) || planning.terminRiskCount > 0

  let maxUtilization = 0
  let minFreeCapacity = Number.POSITIVE_INFINITY
  for (const w of planning.workshops) {
    maxUtilization = Math.max(maxUtilization, w.utilizationPercent)
    minFreeCapacity = Math.min(minFreeCapacity, w.freeCapacity)
    facts.push({
      id: `fact-cap-${w.code}`,
      sourceModule: 'production-planning',
      subjectType: 'WorkCenterCapacity',
      subjectId: w.code,
      label: w.name,
      attributes: {
        workshopCode: w.code,
        utilizationPercent: w.utilizationPercent,
        freeCapacity: w.freeCapacity,
        assignedOrders: w.assignedOrders,
      },
      relatedConceptIds: ['c-work-center', 'c-oee'],
      collectedAt,
    })
  }
  context.maxUtilization = maxUtilization
  context.minFreeCapacity = Number.isFinite(minFreeCapacity) ? minFreeCapacity : 0
  context.capacityOverloaded = maxUtilization >= 95

  // Fabric lot qty as roll-length proxy when cutting dimensions are not on ledger
  const fabricLine = mrpLines.find((l) => l.fabricLots.length > 0)
  if (fabricLine?.fabricLots[0]) {
    context.rollLength = fabricLine.fabricLots[0].netAvailable
  }

  facts.push({
    id: 'fact-derived-context',
    sourceModule: 'derived',
    subjectType: 'FactContextSummary',
    subjectId: 'context',
    label: 'Derived fact context',
    attributes: { ...context },
    relatedConceptIds: ['c-mrp', 'c-warehouse', 'c-quality'],
    collectedAt,
  })

  return { facts, context }
}

export function countFactsByModule(
  facts: BrainFact[],
): Array<{ module: FactSourceModule; factCount: number }> {
  const map = new Map<FactSourceModule, number>()
  for (const f of facts) {
    map.set(f.sourceModule, (map.get(f.sourceModule) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([module, factCount]) => ({ module, factCount }))
    .sort((a, b) => a.module.localeCompare(b.module))
}
