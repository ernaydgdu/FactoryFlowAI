import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  buildCreateProductionOrderContext,
  buildProductionOrderReservationContext,
} from '@/application/catalog/catalog-command.bridge'
import { SALES_ORDERS } from '@/domain/data/orders'
import { getProductById } from '@/domain/data/products'
import { getOrderTimeline } from '@/domain/platform/services/timeline-service'
import {
  addDailyProductionEntry,
  createProductionOrderFromSalesOrder,
  getAllProductionOrderLifecycles,
  getAllowedTransitions,
  getDailyEntriesForOrder,
  getLifecycleAuditTrail,
  getProductionOrderLifecycle,
  getRemainingQty,
  runProductionOrderTwinSimulation,
  transitionProductionOrderStatus,
} from '@/domain/production-order/lifecycle-service'
import { analyzeProductionOrderForBrain } from '@/domain/production-order/lifecycle-brain-query'
import { persistMaterialReservationForOrder } from '@/domain/production-order/material-reservation.service'
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'

import type {
  AddDailyEntryInputDto,
  CreateProductionOrderInputDto,
  DailyProductionEntryLifecycleDto,
  ProductionOrderBrainInsightDto,
  ProductionOrderLifecycleDashboardDto,
  ProductionOrderLifecycleDetailDto,
  ProductionOrderLifecycleListItemDto,
  ProductionOrderTwinSimulationDto,
  SalesOrderForPoCreateDto,
  TransitionProductionOrderInputDto,
} from './production-order-lifecycle.dto'
import { lifecycleStatusBadge } from './production-order-lifecycle.dto'

function mapListItem(record: ProductionOrderLifecycleRecord): ProductionOrderLifecycleListItemDto {
  const progress = record.plannedQty > 0 ? Math.round((record.producedQty / record.plannedQty) * 100) : 0
  return {
    id: record.id,
    productionOrderNo: record.productionOrderNo,
    salesOrderNo: record.salesOrderNo,
    salesOrderId: record.salesOrderId,
    productCode: record.productCode,
    productName: record.productName,
    customer: record.customer,
    buyer: record.buyer,
    workshop: record.workshopName,
    workshopCode: record.workshopCode,
    line: record.productionLineName,
    lineCode: record.productionLineCode,
    plannedQty: record.plannedQty,
    producedQty: record.producedQty,
    remainingQty: getRemainingQty(record),
    rejectQty: record.rejectQty,
    reworkQty: record.reworkQty,
    secondQualityQty: record.secondQualityQty,
    fireQty: record.fireQty,
    startDate: record.startDate ?? '—',
    plannedFinish: record.plannedFinish,
    actualFinish: record.actualFinish ?? '—',
    status: lifecycleStatusBadge(record.status),
    lifecycleStatus: record.status,
    priority: record.priority,
    revision: record.revision,
    progress,
    terminRisk: record.snapshots.planning.terminRiskScore >= 60,
    finishedGoodsReady: record.finishedGoodsReady,
  }
}

export function mapProductionOrderLifecycleList(): ProductionOrderLifecycleListItemDto[] {
  return getAllProductionOrderLifecycles().map(mapListItem)
}

export function mapProductionOrderLifecycleDetail(
  productionOrderNo: string,
): ProductionOrderLifecycleDetailDto | undefined {
  const record = getProductionOrderLifecycle(productionOrderNo)
  if (!record) return undefined

  const audit = getLifecycleAuditTrail(productionOrderNo)
  const timeline = getOrderTimeline(record.salesOrderId)

  return {
    ...mapListItem(record),
    snapshots: record.snapshots,
    reservationApplied: record.reservationApplied,
    allowedTransitions: getAllowedTransitions(productionOrderNo),
    auditTrail: [
      ...audit.map((a, i) => ({
        id: `audit-${i}`,
        occurredAt: a.changedAt,
        actor: a.changedBy,
        action: a.description ?? `${a.action} — ${a.entityType}`,
      })),
      ...timeline.map((t) => ({
        id: t.id,
        occurredAt: t.occurredAt,
        actor: t.actor,
        action: t.description || t.title,
      })),
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  }
}

export function mapDailyEntriesForOrder(productionOrderNo: string): DailyProductionEntryLifecycleDto[] {
  return getDailyEntriesForOrder(productionOrderNo).map((e) => ({
    id: e.id,
    productionOrderNo: e.productionOrderNo,
    entryDate: e.entryDate,
    planned: e.planned,
    produced: e.produced,
    reject: e.reject,
    rework: e.rework,
    secondQuality: e.secondQuality,
    fire: e.fire,
    recordedBy: e.recordedBy,
    recordedAt: e.recordedAt,
  }))
}

export function mapAllDailyEntries(): DailyProductionEntryLifecycleDto[] {
  return getAllProductionOrderLifecycles().flatMap((po) => mapDailyEntriesForOrder(po.productionOrderNo))
}

export function mapBrainInsight(productionOrderNo: string): ProductionOrderBrainInsightDto | null {
  return analyzeProductionOrderForBrain(productionOrderNo)
}

export function mapTwinSimulation(productionOrderNo: string): ProductionOrderTwinSimulationDto {
  const result = runProductionOrderTwinSimulation(productionOrderNo)
  return {
    productionOrderNo,
    sideEffects: 'NONE',
    scenarioId: result.scenarioId,
    summary: result.scenarioName,
    impactScore: result.outcomes.length > 0 ? Math.abs(Number(result.outcomes[0]?.delta ?? 0)) : 0,
  }
}

export function mapSalesOrdersForCreate(): SalesOrderForPoCreateDto[] {
  const existing = new Set(getAllProductionOrderLifecycles().filter((p) => p.status !== 'Cancelled').map((p) => p.salesOrderId))
  return SALES_ORDERS.map((o) => {
    const product = getProductById(o.productCardId)
    return {
      id: o.id,
      orderNo: o.orderNo,
      customer: o.general.customer,
      productCode: product?.productCode ?? '—',
      productName: product?.productName ?? '—',
      quantity: o.matrixTotals.grandTotal,
      hasProductionOrder: existing.has(o.id),
    }
  })
}

export function mapLifecycleDashboard(): ProductionOrderLifecycleDashboardDto {
  const orders = getAllProductionOrderLifecycles()
  return {
    kpis: [
      { label: 'Toplam UE', value: String(orders.length), hint: 'Yaşam döngüsü' },
      { label: 'Üretimde', value: String(orders.filter((o) => o.status === 'In Production').length), hint: '' },
      { label: 'Termin Risk', value: String(orders.filter((o) => o.snapshots.planning.terminRiskScore >= 60).length), hint: '' },
      { label: 'Mamül Hazır', value: String(orders.filter((o) => o.finishedGoodsReady).length), hint: 'BR-08' },
    ],
  }
}

export function executeCreateProductionOrder(input: CreateProductionOrderInputDto) {
  return runCommandInTransaction(() => {
    const context = buildCreateProductionOrderContext(input.salesOrderId)
    const record = createProductionOrderFromSalesOrder(context, input.actor ?? 'planner', input.priority)
    return mapListItem(record)
  })
}

export function executeTransitionProductionOrder(input: TransitionProductionOrderInputDto) {
  return runCommandInTransaction(() => {
    const record = getProductionOrderLifecycle(input.productionOrderNo)
    const reservationContext =
      input.toStatus === 'Released' && record
        ? buildProductionOrderReservationContext(record.salesOrderId, record.productCardId)
        : undefined
    const updated = transitionProductionOrderStatus(
      input.productionOrderNo,
      input.toStatus,
      input.actor ?? 'planner',
      reservationContext,
    )
    // Material reservation bağlantısı: BR-03 doğrulaması geçtikten sonra
    // rezervasyonu kalıcı stok defterine de işle (satır bazında best-effort;
    // stok kartı olmayan / yetersiz stoklu satırlar sonuçta raporlanır).
    if (input.toStatus === 'Released') {
      persistMaterialReservationForOrder(input.productionOrderNo, input.actor ?? 'planner')
    }
    return mapListItem(updated)
  })
}

export function executeAddDailyEntry(input: AddDailyEntryInputDto) {
  return runCommandInTransaction(() => {
    addDailyProductionEntry(input.productionOrderNo, {
      entryDate: input.entryDate,
      planned: input.planned,
      produced: input.produced,
      reject: input.reject,
      rework: input.rework,
      secondQuality: input.secondQuality,
      fire: input.fire,
      recordedBy: input.recordedBy,
    })
    return mapProductionOrderLifecycleDetail(input.productionOrderNo)
  })
}
