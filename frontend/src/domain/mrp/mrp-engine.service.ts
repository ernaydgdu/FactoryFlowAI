/**
 * MRP Engine — Tier-1 textile planning: variant explosion, lots, safety stock, grouped proposals.
 */
import { productionLineRepository, workshopRepository } from '@/domain/master-data'
import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'
import { queryAllPurchaseOrders } from '@/domain/purchasing/purchase-order-query.service'
import { queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { queryAllStockCards, queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type { SalesOrder } from '@/domain/types'

import {
  consolidateProductDemands,
  explodeOrderVariantDemands,
} from './mrp-explosion.service'
import {
  applySafetyStockToRequirement,
  effectiveAvailableFromLots,
  readFabricLots,
  readLeadTimeBreakdown,
  readSafetyStockPolicy,
} from './mrp-stock-policy.service'
import type {
  MrpException,
  MrpProductionProposalGroup,
  MrpProductionSuggestion,
  MrpPurchaseProposalGroup,
  MrpPurchaseSuggestion,
  MrpSnapshot,
  MrpSnapshotLine,
  MrpVariantDemand,
} from './mrp.types'

const PURCHASE_CATEGORIES = new Set([
  'Kumaş',
  'Aksesuar',
  'Düğme',
  'Etiket',
  'Fermuar',
  'İplik',
  'Poşet',
  'Karton',
  'Askı',
  'Koli',
  'Tela',
  'Dokuma Etiket',
])
const OPEN_PO_STATUSES = new Set(['Open', 'Partially Received', 'Approved'])
const OPEN_PRODUCTION_STATUSES = new Set([
  'Draft',
  'Planned',
  'Approved',
  'Released',
  'In Production',
  'Paused',
])

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function isMrpEligibleOrder(order: SalesOrder): boolean {
  if (order.status === 'Cancelled' || order.status === 'Archived') return false
  if (order.productionStatus === 'Sevk Edildi' || order.productionStatus === 'Tamamlandı') return false
  return order.status === 'Approved' || order.status === 'Active' || order.status === 'Under Review'
}

function buildOpenPurchaseByCode(referenceDate: Date): Map<string, { qty: number; late: boolean }> {
  const map = new Map<string, { qty: number; late: boolean }>()
  for (const po of queryAllPurchaseOrders()) {
    if (!OPEN_PO_STATUSES.has(po.status)) continue
    const isLate = new Date(po.termin) < referenceDate
    for (const line of po.lines) {
      const prev = map.get(line.materialCode) ?? { qty: 0, late: false }
      map.set(line.materialCode, {
        qty: prev.qty + line.remainingQty,
        late: prev.late || isLate,
      })
    }
  }
  return map
}

function buildOpenProductionByStock(): Map<string, number> {
  const map = new Map<string, number>()
  for (const po of queryAllProductionOrders()) {
    if (!OPEN_PRODUCTION_STATUSES.has(po.status)) continue
    const remaining = Math.max(0, po.plannedQty - po.producedQty)
    for (const bomLine of po.snapshots.bom) {
      const demand = round2(bomLine.consumption * remaining)
      map.set(bomLine.stockCardId, (map.get(bomLine.stockCardId) ?? 0) + demand)
    }
  }
  return map
}

function buildReservedStockByCard(): Map<string, number> {
  const map = new Map<string, number>()
  for (const order of queryAllSalesOrders()) {
    if (order.status === 'Cancelled' || order.status === 'Archived') continue
    for (const line of order.mrp.lines) {
      if (line.status === 'Rezerve' || line.status === 'Sipariş Verildi') {
        map.set(line.stockCardId, (map.get(line.stockCardId) ?? 0) + line.netRequired)
      }
    }
  }
  return map
}

function resolveWorkshopAndLine() {
  const workshop = workshopRepository.getActive()[0]
  const line = workshop
    ? productionLineRepository.find((l) => l.workshopId === workshop.id)[0]
    : productionLineRepository.getActive()[0]
  return {
    workshopCode: workshop?.code ?? 'FSN-A',
    workshopName: workshop?.name ?? '—',
    productionLineCode: line?.code ?? 'LN-01',
    capacityPerDay: line?.capacityPerDay ?? 500,
    monthlyCapacity: workshop?.monthlyCapacity ?? 15000,
    currentLoad: workshop?.currentLoad ?? 0,
  }
}

function groupPurchaseSuggestions(suggestions: MrpPurchaseSuggestion[]): MrpPurchaseProposalGroup[] {
  const bySupplier = new Map<string, MrpPurchaseSuggestion[]>()
  for (const s of suggestions) {
    const list = bySupplier.get(s.supplier) ?? []
    list.push(s)
    bySupplier.set(s.supplier, list)
  }
  return Array.from(bySupplier.entries()).map(([supplier, items]) => ({
    supplier,
    totalQuantity: round2(items.reduce((sum, i) => sum + i.quantity, 0)),
    lineCount: items.length,
    earliestRequiredDate: items.reduce(
      (min, i) => (i.requiredDate < min ? i.requiredDate : min),
      items[0]?.requiredDate ?? '',
    ),
    suggestionIds: items.map((i) => i.id),
  }))
}

function groupProductionSuggestions(
  suggestions: MrpProductionSuggestion[],
): MrpProductionProposalGroup[] {
  const byKey = new Map<string, MrpProductionSuggestion[]>()
  for (const s of suggestions) {
    const key = `${s.workshopCode}:${s.productionLineCode}`
    const list = byKey.get(key) ?? []
    list.push(s)
    byKey.set(key, list)
  }

  return Array.from(byKey.entries()).map(([, items]) => {
    const first = items[0]!
    const allocatedQty = items.reduce((sum, i) => sum + i.quantity, 0)
    const workshop = workshopRepository.getByCode(first.workshopCode)
    const monthlyCapacity = workshop?.monthlyCapacity ?? 15000
    const currentLoad = workshop?.currentLoad ?? 0
    const utilizationPercent = round2(((currentLoad + allocatedQty) / monthlyCapacity) * 100)
    return {
      workshopCode: first.workshopCode,
      workshopName: first.workshopName,
      productionLineCode: first.productionLineCode,
      capacityPerDay: first.capacityPerDay,
      allocatedQty,
      utilizationPercent,
      suggestionIds: items.map((i) => i.id),
    }
  })
}

function aggregateVariantDemands(
  allVariants: MrpVariantDemand[],
  orders: SalesOrder[],
  stockById: Map<string, ReturnType<typeof queryStockCardById>>,
  openPurchaseByCode: Map<string, { qty: number; late: boolean }>,
  openProductionByStock: Map<string, number>,
  reservedByStock: Map<string, number>,
  _referenceDate: Date,
): { lines: MrpSnapshotLine[]; exceptions: MrpException[] } {
  const lineMap = new Map<string, MrpSnapshotLine>()
  const exceptions: MrpException[] = []
  const variantCountByOrderStock = new Map<string, number>()

  for (const v of allVariants) {
    const card = stockById.get(v.stockCardId)
    const materialCode = card?.code ?? v.stockCardId
    v.materialCode = materialCode
    const key = v.stockCardId
    variantCountByOrderStock.set(
      `${v.orderId}:${key}`,
      (variantCountByOrderStock.get(`${v.orderId}:${key}`) ?? 0) + 1,
    )

    const existing = lineMap.get(key)
    if (existing) {
      existing.grossRequirement = round2(existing.grossRequirement + v.grossRequired)
      existing.netRequirement = round2(existing.netRequirement + v.netRequired)
      const ob = existing.orderBreakdown.find((o) => o.orderId === v.orderId)
      if (ob) {
        ob.quantity = round2(ob.quantity + v.netRequired)
        ob.variantCount = variantCountByOrderStock.get(`${v.orderId}:${key}`) ?? 1
      } else {
        existing.orderBreakdown.push({
          orderId: v.orderId,
          orderNo: v.orderNo,
          productCardId: v.productCardId,
          quantity: v.netRequired,
          variantCount: 1,
        })
      }
    } else if (card) {
      const safetyStock = readSafetyStockPolicy(card)
      const leadTime = readLeadTimeBreakdown(card)
      const fabricLots = readFabricLots(card)
      const availableStock = effectiveAvailableFromLots(card)
      const openPo = openPurchaseByCode.get(materialCode)

      if (!card.supplier || card.supplier === '—') {
        exceptions.push({
          code: 'NO_SUPPLIER',
          message: `${materialCode}: Tedarikçi tanımsız`,
          entityRef: materialCode,
          severity: 'warning',
        })
      }
      if (availableStock < 0) {
        exceptions.push({
          code: 'NEGATIVE_STOCK',
          message: `${materialCode}: Negatif stok (${availableStock})`,
          entityRef: materialCode,
          severity: 'critical',
        })
      }
      if (openPo?.late) {
        exceptions.push({
          code: 'LATE_PURCHASE',
          message: `${materialCode}: Gecikmiş açık satın alma`,
          entityRef: materialCode,
          severity: 'warning',
        })
      }

      lineMap.set(key, {
        stockCardId: v.stockCardId,
        materialCode,
        materialName: card.name,
        category: card.category,
        unit: card.unit,
        grossRequirement: v.grossRequired,
        netRequirement: v.netRequired,
        availableStock,
        reservedStock: reservedByStock.get(key) ?? 0,
        openPurchaseQty: openPo?.qty ?? 0,
        openProductionQty: openProductionByStock.get(key) ?? 0,
        netShortage: 0,
        purchaseRequirement: 0,
        productionRequirement: 0,
        safetyStock,
        leadTime,
        fabricLots,
        orderBreakdown: [
          {
            orderId: v.orderId,
            orderNo: v.orderNo,
            productCardId: v.productCardId,
            quantity: v.netRequired,
            variantCount: 1,
          },
        ],
        suggestedSupplier: card.supplier,
        exceptionMessages: [],
        exceptionCodes: [],
      })
    }
  }

  // Fallback: orders without variant explosion use embedded mrp lines
  for (const order of orders) {
    for (const mrpLine of order.mrp.lines) {
      if (lineMap.has(mrpLine.stockCardId)) continue
      const card = stockById.get(mrpLine.stockCardId)
      lineMap.set(mrpLine.stockCardId, {
        stockCardId: mrpLine.stockCardId,
        materialCode: mrpLine.code,
        materialName: mrpLine.materialName,
        category: mrpLine.category,
        unit: mrpLine.unit,
        grossRequirement: mrpLine.grossRequired,
        netRequirement: mrpLine.netRequired,
        availableStock: card ? effectiveAvailableFromLots(card) : 0,
        reservedStock: reservedByStock.get(mrpLine.stockCardId) ?? 0,
        openPurchaseQty: openPurchaseByCode.get(mrpLine.code)?.qty ?? 0,
        openProductionQty: openProductionByStock.get(mrpLine.stockCardId) ?? 0,
        netShortage: 0,
        purchaseRequirement: 0,
        productionRequirement: 0,
        safetyStock: card ? readSafetyStockPolicy(card) : { minStock: 0, maxStock: 0, reorderPoint: 0 },
        leadTime: card
          ? readLeadTimeBreakdown(card)
          : { supplierDays: mrpLine.leadTimeDays, productionDays: 0, transitDays: 3, totalDays: mrpLine.leadTimeDays + 3 },
        fabricLots: card ? readFabricLots(card) : [],
        orderBreakdown: [
          {
            orderId: order.id,
            orderNo: order.orderNo,
            productCardId: order.productCardId,
            quantity: mrpLine.netRequired,
            variantCount: 0,
          },
        ],
        suggestedSupplier: mrpLine.supplier,
        exceptionMessages: [],
        exceptionCodes: [],
      })
    }
  }

  const lines: MrpSnapshotLine[] = Array.from(lineMap.values()).map((line) => {
    const adjustedRequirement = applySafetyStockToRequirement(
      line.netRequirement,
      line.safetyStock,
      line.availableStock,
    )
    const supply = line.availableStock + line.openPurchaseQty + line.openProductionQty - line.reservedStock
    const netShortage = round2(Math.max(0, adjustedRequirement - supply))
    const purchaseRequirement = PURCHASE_CATEGORIES.has(line.category)
      ? round2(Math.max(0, adjustedRequirement - line.availableStock - line.openPurchaseQty))
      : 0
    const productionRequirement = !PURCHASE_CATEGORIES.has(line.category)
      ? round2(Math.max(0, adjustedRequirement - line.availableStock - line.openProductionQty))
      : 0

    const lineExceptions: MrpException[] = []
    const coverageRatio = line.netRequirement > 0 ? supply / line.netRequirement : 1
    if (coverageRatio < 0.5 && line.netRequirement > 0) {
      lineExceptions.push({
        code: 'LOW_COVERAGE',
        message: `${line.materialCode}: Düşük stok karşılama (%${Math.round(coverageRatio * 100)})`,
        entityRef: line.materialCode,
        severity: 'warning',
      })
    }
    if (line.availableStock < line.safetyStock.minStock) {
      lineExceptions.push({
        code: 'LOW_COVERAGE',
        message: `${line.materialCode}: Min stok altında (${line.availableStock} < ${line.safetyStock.minStock})`,
        entityRef: line.materialCode,
        severity: 'warning',
      })
    }

    for (const ex of lineExceptions) exceptions.push(ex)

    return {
      ...line,
      netRequirement: round2(adjustedRequirement),
      grossRequirement: round2(line.grossRequirement),
      netShortage,
      purchaseRequirement,
      productionRequirement,
      exceptionMessages: lineExceptions.map((e) => e.message),
      exceptionCodes: lineExceptions.map((e) => e.code),
    }
  })

  lines.sort((a, b) => b.netShortage - a.netShortage)
  return { lines, exceptions }
}

export function calculateMrpSnapshot(revisionNo: number, referenceDate: Date = new Date()): MrpSnapshot {
  const orders = queryAllSalesOrders().filter(isMrpEligibleOrder)
  const stockById = new Map(queryAllStockCards().map((s) => [s.id, s]))
  const openPurchaseByCode = buildOpenPurchaseByCode(referenceDate)
  const openProductionByStock = buildOpenProductionByStock()
  const reservedByStock = buildReservedStockByCard()
  const ws = resolveWorkshopAndLine()

  const allExceptions: MrpException[] = []
  const allVariants: MrpVariantDemand[] = []

  for (const order of orders) {
    const { variantDemands, exceptions } = explodeOrderVariantDemands(order)
    allVariants.push(...variantDemands)
    allExceptions.push(...exceptions)
  }

  const { consolidations, exceptions: consolidationExceptions } = consolidateProductDemands(orders)
  allExceptions.push(...consolidationExceptions)

  const { lines, exceptions: lineExceptions } = aggregateVariantDemands(
    allVariants,
    orders,
    stockById,
    openPurchaseByCode,
    openProductionByStock,
    reservedByStock,
    referenceDate,
  )
  allExceptions.push(...lineExceptions)

  // Late production check
  for (const po of queryAllProductionOrders()) {
    if (!OPEN_PRODUCTION_STATUSES.has(po.status)) continue
    if (new Date(po.plannedFinish) < referenceDate && po.producedQty < po.plannedQty) {
      allExceptions.push({
        code: 'LATE_PRODUCTION',
        message: `${po.productionOrderNo}: Gecikmiş üretim emri`,
        entityRef: po.productionOrderNo,
        severity: 'warning',
      })
    }
  }

  const purchaseSuggestions: MrpPurchaseSuggestion[] = lines
    .filter((l) => l.purchaseRequirement > 0)
    .map((l, i) => ({
      id: `mrp-pr-${l.stockCardId}-${revisionNo}-${i}`,
      stockCardId: l.stockCardId,
      materialCode: l.materialCode,
      materialName: l.materialName,
      quantity: l.purchaseRequirement,
      unit: l.unit,
      supplier: l.suggestedSupplier,
      requiredDate: new Date(
        referenceDate.getTime() + l.leadTime.totalDays * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      leadTime: l.leadTime,
      status: 'Pending' as const,
    }))

  const productionSuggestions: MrpProductionSuggestion[] = orders
    .filter((o) => o.production.producedQty === 0 && o.productionStatus !== 'Üretimde')
    .map((o, i) => {
      const pc = queryProductCardById(o.productCardId)
      const requiredDate = o.lineDeliveryDate ?? o.general.exf
      const isLate = new Date(requiredDate) < referenceDate
      if (isLate) {
        allExceptions.push({
          code: 'LATE_PRODUCTION',
          message: `${o.orderNo}: Termin geçmiş, üretim önerisi gecikmeli`,
          entityRef: o.orderNo,
          severity: 'warning',
        })
      }
      return {
        id: `mrp-prod-${o.id}-${revisionNo}-${i}`,
        salesOrderId: o.id,
        orderNo: o.orderNo,
        productCardId: o.productCardId,
        productCode: pc?.productCode ?? o.productCardId,
        quantity: o.matrixTotals.grandTotal,
        workshopCode: ws.workshopCode,
        workshopName: ws.workshopName,
        productionLineCode: ws.productionLineCode,
        requiredDate,
        capacityPerDay: ws.capacityPerDay,
        status: 'Pending' as const,
      }
    })

  const dedupedExceptions = dedupeExceptions(allExceptions)

  return {
    revisionNo,
    generatedAt: referenceDate.toISOString(),
    openOrderCount: orders.length,
    productConsolidations: consolidations,
    variantDemands: allVariants,
    lines,
    purchaseSuggestions,
    purchaseProposalGroups: groupPurchaseSuggestions(purchaseSuggestions),
    productionSuggestions,
    productionProposalGroups: groupProductionSuggestions(productionSuggestions),
    exceptions: dedupedExceptions,
    exceptionMessages: dedupedExceptions.map((e) => e.message),
  }
}

function dedupeExceptions(exceptions: MrpException[]): MrpException[] {
  const seen = new Set<string>()
  return exceptions.filter((e) => {
    const key = `${e.code}:${e.entityRef ?? e.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
