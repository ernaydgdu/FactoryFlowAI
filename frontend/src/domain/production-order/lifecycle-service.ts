/**
 * Production Order Lifecycle Service — mevcut engine'leri orchestrate eder, değiştirmez.
 */
import { SALES_ORDERS, getSalesOrderById } from '../data/orders'
import { getProductById } from '../data/products'
import { getStockCardById } from '../data/stock-cards'
import { productionLineRepository, workshopRepository, getFinishedGoodsWarehouseCode } from '../master-data'
import { logCreate, logUpdate, getAuditTrail, type AuditContext } from '../platform/services/audit-service'
import { addTimelineEntry } from '../platform/services/timeline-service'
import { platformPublish, wirePlatformServices } from '../platform/services/platform-orchestrator'
import { notifyWatchers } from '../platform/services/watcher-service'
import {
  BUSINESS_RULES,
  ruleProductionComplete,
  ruleProductionOrderReservation,
} from '../services/business-rule-engine'
import { runPlanningEngineForOrder } from '../services/planning-engine'
import { calculateDetailedCost } from '../services/planning/cost-engine'
import { calculateTerminPlan } from '../services/planning/termin-engine'
import { buildProductionTracking } from '../services/textile/production-tracking-service'
import { createEmptyLedger } from '../services/stock-ledger'
import { createTwinScenario, runTwinScenario } from '../brain/twin/engines/scenario-engine'
import { buildFactoryGraph } from '../brain/twin/engines/factory-graph-engine'
import { createBrainContext } from '../brain/services/brain-kernel'
import { knowledgeLayer } from '../brain/services/knowledge-layer'
import { KEPLER_BRAIN_COMPANY_ID } from '../brain/constants'

import type {
  DailyProductionEntryRecord,
  ProductionOrderLifecycleRecord,
  ProductionOrderLifecycleStatus,
  ProductionOrderPriority,
  ProductionOrderSnapshot,
} from './lifecycle-types'
import { ALLOWED_NEXT_STATUS, LIFECYCLE_TRANSITIONS } from './lifecycle-types'

const lifecycleStore = new Map<string, ProductionOrderLifecycleRecord>()
const dailyEntryStore: DailyProductionEntryRecord[] = []
let poCounter = SALES_ORDERS.length
let entryCounter = 0

function defaultAudit(actor = 'system'): AuditContext {
  return { changedBy: actor, ip: '127.0.0.1', machine: 'lifecycle-service' }
}

function mapLegacyStatus(
  productionStatus: string,
  linkStatus: string,
): ProductionOrderLifecycleStatus {
  if (productionStatus === 'Beklemede') return 'Draft'
  if (linkStatus === 'Tamamlandı' && productionStatus === 'Tamamlandı') return 'Completed'
  if (productionStatus === 'Sevk Edildi') return 'Closed'
  if (linkStatus === 'Devam Ediyor') return 'In Production'
  if (linkStatus === 'Planlandı') return 'Released'
  return 'Planned'
}

function buildSnapshots(order: (typeof SALES_ORDERS)[0], revision: number): ProductionOrderSnapshot {
  const product = getProductById(order.productCardId)!
  const planning = runPlanningEngineForOrder(order)
  const cost = calculateDetailedCost(order)
  const termin = calculateTerminPlan(order)
  const tracking = buildProductionTracking(order)
  const workshop = workshopRepository.getByCode(
    tracking.operations[0]?.workshopCode ?? workshopRepository.getActive()[0]?.code ?? '',
  )
  const line = productionLineRepository.getById(
    tracking.operations[0]?.lineId ?? productionLineRepository.getActive()[0]?.id ?? '',
  )

  return {
    capturedAt: new Date().toISOString(),
    revision,
    bom: product.bom.map((b) => {
      const sc = getStockCardById(b.stockCardId)
      return {
        stockCardId: b.stockCardId,
        code: sc?.code ?? b.stockCardId,
        name: sc?.name ?? '—',
        consumption: b.actualConsumption,
        unit: sc?.unit ?? 'ad',
      }
    }),
    operationRoute: tracking.operations.map((op, i) => ({
      sequence: i + 1,
      code: op.operationCode,
      name: op.operationName,
      workshopCode: op.workshopCode,
    })),
    cost: {
      fabric: cost.fabric,
      accessory: cost.accessory,
      labor: cost.labor,
      overhead: cost.overhead,
      total: cost.totalCost,
      currency: order.general.currency,
    },
    planning: {
      terminRiskScore: planning.risk.score,
      capacityUtilization: workshop
        ? Math.round((workshop.currentLoad / workshop.monthlyCapacity) * 100)
        : 0,
      plannedStart: termin.milestones.find((m) => m.stage === 'SEWING')?.plannedDate ?? order.exfDate,
      plannedFinish: termin.milestones.find((m) => m.stage === 'SHIPPING')?.plannedDate ?? order.exfDate,
      workshopCode: workshop?.code ?? '—',
      lineCode: line?.code ?? '—',
    },
  }
}

function seedFromSalesOrders(): void {
  if (lifecycleStore.size > 0) return
  for (const order of SALES_ORDERS) {
    if (order.productionStatus === 'Beklemede' && order.production.producedQty === 0) continue
    const tracking = buildProductionTracking(order)
    const workshop = workshopRepository.getByCode(
      tracking.operations[0]?.workshopCode ?? workshopRepository.getActive()[0]?.code ?? '',
    )
    const line = productionLineRepository.getById(
      tracking.operations[0]?.lineId ?? productionLineRepository.getActive()[0]?.id ?? '',
    )
    const product = getProductById(order.productCardId)!
    const status = mapLegacyStatus(order.productionStatus, order.production.status)
    const record: ProductionOrderLifecycleRecord = {
      id: order.production.workOrderNo,
      productionOrderNo: order.production.workOrderNo,
      salesOrderId: order.id,
      salesOrderNo: order.orderNo,
      productCardId: order.productCardId,
      productCode: product.productCode,
      productName: product.productName,
      customer: order.general.customer,
      buyer: product.buyer,
      workshopId: workshop?.id ?? '',
      workshopCode: workshop?.code ?? '—',
      workshopName: workshop?.name ?? '—',
      productionLineId: line?.id ?? '',
      productionLineCode: line?.code ?? '—',
      productionLineName: line?.name ?? '—',
      plannedQty: order.production.plannedQty,
      producedQty: order.production.producedQty,
      rejectQty: Math.floor(order.production.wasteQty * 0.3),
      reworkQty: order.production.reworkQty,
      secondQualityQty: order.production.secondQualityQty,
      fireQty: order.production.wasteQty,
      startDate: status === 'In Production' || status === 'Completed' || status === 'Closed' ? order.exfDate : null,
      plannedFinish: order.exfDate,
      actualFinish: status === 'Completed' || status === 'Closed' ? order.exfDate : null,
      status,
      priority: order.terminRisk ? 'High' : 'Normal',
      revision: 1,
      snapshots: buildSnapshots(order, 1),
      reservationApplied: order.production.bomReserved,
      finishedGoodsReady: status === 'Completed' || status === 'Closed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    lifecycleStore.set(record.productionOrderNo, record)
  }
}

function emitLifecycleEvent(
  record: ProductionOrderLifecycleRecord,
  description: string,
  actor: string,
  eventType: 'ProductionStarted' | 'ProductionFinished' | 'EntityUpdated' = 'EntityUpdated',
): void {
  wirePlatformServices()
  platformPublish({
    type: eventType,
    aggregateType: 'ProductionOrder',
    aggregateId: record.id,
    aggregateNo: record.productionOrderNo,
    payload: { status: record.status, description },
    causedBy: actor,
  })
  addTimelineEntry({
    orderId: record.salesOrderId,
    orderNo: record.salesOrderNo,
    eventType: 'StatusChanged',
    description: `[${record.productionOrderNo}] ${description}`,
    actor,
    metadata: { productionOrderNo: record.productionOrderNo, status: record.status },
  })
  notifyWatchers('ProductionOrder', record.id, record.productionOrderNo, description)
}

function validateTransitionRule(
  record: ProductionOrderLifecycleRecord,
  to: ProductionOrderLifecycleStatus,
): { ok: true; ruleId: string } | { ok: false; errors: string[] } {
  const rule = LIFECYCLE_TRANSITIONS.find((t) => t.from === record.status && t.to === to)
  if (!rule) {
    return { ok: false, errors: [`Geçiş tanımsız: ${record.status} → ${to}`] }
  }
  const br = BUSINESS_RULES.find((r) => r.id === rule.businessRuleId)
  if (!br) {
    return { ok: false, errors: [`Business rule bulunamadı: ${rule.businessRuleId}`] }
  }

  const errors: string[] = []
  if (to === 'Released' && record.plannedQty <= 0) errors.push('Planlanan adet sıfır olamaz')
  if (to === 'In Production' && !record.reservationApplied && record.status !== 'Paused') {
    errors.push('BR-03: BOM rezervasyonu gerekli (Approved → Released)')
  }
  if (to === 'Completed' && record.producedQty <= 0) errors.push('Tamamlamak için üretilmiş adet gerekli')
  if (to === 'Closed' && record.status !== 'Completed') errors.push('Kapatmadan önce Completed olmalı')

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, ruleId: rule.businessRuleId }
}

export function getAllProductionOrderLifecycles(): ProductionOrderLifecycleRecord[] {
  seedFromSalesOrders()
  return [...lifecycleStore.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getProductionOrderLifecycle(productionOrderNo: string): ProductionOrderLifecycleRecord | undefined {
  seedFromSalesOrders()
  return lifecycleStore.get(productionOrderNo)
}

export function createProductionOrderFromSalesOrder(
  salesOrderId: string,
  actor: string,
  priority: ProductionOrderPriority = 'Normal',
): ProductionOrderLifecycleRecord {
  seedFromSalesOrders()
  const order = getSalesOrderById(salesOrderId)
  if (!order) throw new Error('Sipariş bulunamadı')

  const existing = [...lifecycleStore.values()].find(
    (p) => p.salesOrderId === salesOrderId && p.status !== 'Cancelled',
  )
  if (existing) throw new Error(`Bu sipariş için UE zaten var: ${existing.productionOrderNo}`)

  poCounter += 1
  const workOrderNo = `UE-2026-${String(poCounter).padStart(4, '0')}`
  const product = getProductById(order.productCardId)!
  const snapshots = buildSnapshots(order, 1)
  const workshop = workshopRepository.getByCode(snapshots.planning.workshopCode)
  const line = productionLineRepository.getByCode(snapshots.planning.lineCode)

  const record: ProductionOrderLifecycleRecord = {
    id: workOrderNo,
    productionOrderNo: workOrderNo,
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    productCardId: order.productCardId,
    productCode: product.productCode,
    productName: product.productName,
    customer: order.general.customer,
    buyer: product.buyer,
    workshopId: workshop?.id ?? '',
    workshopCode: workshop?.code ?? snapshots.planning.workshopCode,
    workshopName: workshop?.name ?? '—',
    productionLineId: line?.id ?? '',
    productionLineCode: line?.code ?? snapshots.planning.lineCode,
    productionLineName: line?.name ?? '—',
    plannedQty: order.production.plannedQty || order.matrixTotals.grandTotal,
    producedQty: 0,
    rejectQty: 0,
    reworkQty: 0,
    secondQualityQty: 0,
    fireQty: 0,
    startDate: null,
    plannedFinish: snapshots.planning.plannedFinish,
    actualFinish: null,
    status: 'Draft',
    priority,
    revision: 1,
    snapshots,
    reservationApplied: false,
    finishedGoodsReady: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  lifecycleStore.set(workOrderNo, record)
  logCreate('ProductionOrder', workOrderNo, defaultAudit(actor), { status: 'Draft', salesOrderNo: order.orderNo })
  emitLifecycleEvent(record, 'Üretim emri oluşturuldu (Draft)', actor)
  return record
}

export function transitionProductionOrderStatus(
  productionOrderNo: string,
  toStatus: ProductionOrderLifecycleStatus,
  actor: string,
): ProductionOrderLifecycleRecord {
  seedFromSalesOrders()
  const record = lifecycleStore.get(productionOrderNo)
  if (!record) throw new Error('Üretim emri bulunamadı')

  const allowed = ALLOWED_NEXT_STATUS[record.status]
  if (!allowed.includes(toStatus)) {
    throw new Error(`Geçersiz durum geçişi: ${record.status} → ${toStatus}`)
  }

  const validation = validateTransitionRule(record, toStatus)
  if (!validation.ok) throw new Error(validation.errors.join('; '))

  const oldStatus = record.status
  const audit = defaultAudit(actor)

  if (toStatus === 'Released') {
    const order = getSalesOrderById(record.salesOrderId)!
    const product = getProductById(order.productCardId)!
    const ledger = createEmptyLedger()
    const result = ruleProductionOrderReservation(
      {
        productionOrderId: record.id,
        productionOrderNo: record.productionOrderNo,
        orderId: record.salesOrderId,
        orderNo: record.salesOrderNo,
        lines: product.bom.map((b) => ({
          stockCardId: b.stockCardId,
          warehouseCode: getStockCardById(b.stockCardId)?.warehouseCode ?? 'WH-RM',
          quantity: Math.ceil(b.actualConsumption * record.plannedQty),
        })),
        createdBy: actor,
      },
      ledger,
    )
    if (!result.success) throw new Error(result.errors?.join('; ') ?? 'Rezervasyon başarısız')
    record.reservationApplied = true
  }

  if (toStatus === 'In Production' && !record.startDate) {
    record.startDate = new Date().toISOString().slice(0, 10)
  }

  if (toStatus === 'Completed') {
    const ledger = createEmptyLedger()
    const result = ruleProductionComplete(
      record.id,
      record.productionOrderNo,
      record.salesOrderNo,
      record.producedQty,
      getFinishedGoodsWarehouseCode(),
      ledger,
      actor,
    )
    if (!result.success) throw new Error(result.errors?.join('; ') ?? 'Rezervasyon başarısız')
    record.finishedGoodsReady = true
    record.actualFinish = new Date().toISOString().slice(0, 10)
  }

  record.status = toStatus
  record.updatedAt = new Date().toISOString()
  logUpdate('ProductionOrder', record.id, audit, { status: oldStatus }, { status: toStatus })

  const eventType =
    toStatus === 'In Production' ? 'ProductionStarted' : toStatus === 'Completed' ? 'ProductionFinished' : 'EntityUpdated'
  emitLifecycleEvent(record, `Durum: ${oldStatus} → ${toStatus} (${validation.ruleId})`, actor, eventType)
  lifecycleStore.set(productionOrderNo, record)
  return record
}

export function addDailyProductionEntry(
  productionOrderNo: string,
  input: Omit<DailyProductionEntryRecord, 'id' | 'productionOrderNo' | 'recordedAt'>,
): DailyProductionEntryRecord {
  seedFromSalesOrders()
  const record = lifecycleStore.get(productionOrderNo)
  if (!record) throw new Error('Üretim emri bulunamadı')
  if (record.status !== 'In Production' && record.status !== 'Paused') {
    throw new Error('Günlük giriş yalnızca In Production veya Paused durumunda')
  }

  entryCounter += 1
  const entry: DailyProductionEntryRecord = {
    id: `dpe-${entryCounter}`,
    productionOrderNo,
    ...input,
    recordedAt: new Date().toISOString(),
  }
  dailyEntryStore.push(entry)

  record.producedQty += input.produced
  record.rejectQty += input.reject
  record.reworkQty += input.rework
  record.secondQualityQty += input.secondQuality
  record.fireQty += input.fire
  record.updatedAt = new Date().toISOString()
  lifecycleStore.set(productionOrderNo, record)

  emitLifecycleEvent(
    record,
    `Günlük giriş: plan ${input.planned}, gerçek ${input.produced}, fire ${input.fire}`,
    input.recordedBy,
  )
  return entry
}

export function getDailyEntriesForOrder(productionOrderNo: string): DailyProductionEntryRecord[] {
  return dailyEntryStore.filter((e) => e.productionOrderNo === productionOrderNo)
}

export function getAllowedTransitions(productionOrderNo: string): ProductionOrderLifecycleStatus[] {
  const record = getProductionOrderLifecycle(productionOrderNo)
  if (!record) return []
  return ALLOWED_NEXT_STATUS[record.status]
}

export function runProductionOrderTwinSimulation(productionOrderNo: string) {
  const record = getProductionOrderLifecycle(productionOrderNo)
  if (!record) throw new Error('Üretim emri bulunamadı')
  const ctx = createBrainContext({
    userId: 'lifecycle-service',
    companyId: KEPLER_BRAIN_COMPANY_ID,
    sessionId: `pol-twin-${productionOrderNo}`,
    operationMode: 'SIMULATE',
    scope: {
      entityType: 'ProductionOrder',
      entityId: productionOrderNo,
      orderId: record.salesOrderId,
      orderNo: record.salesOrderNo,
      focusArea: 'PRODUCTION',
    },
  })
  const snapshot = knowledgeLayer.assembleSnapshot(ctx)
  const graph = buildFactoryGraph(ctx, snapshot)
  const scenario = createTwinScenario('WORKSHOP_CLOSED', { workshopCode: record.workshopCode })
  const result = runTwinScenario(scenario, graph)
  return { ...result, sideEffects: 'NONE' as const, productionOrderNo }
}

export function getRemainingQty(record: ProductionOrderLifecycleRecord): number {
  return Math.max(0, record.plannedQty - record.producedQty - record.fireQty)
}

export function getLifecycleAuditTrail(productionOrderNo: string) {
  return getAuditTrail('ProductionOrder', productionOrderNo)
}
