/**
 * Production Order Lifecycle Service — mevcut engine'leri orchestrate eder, değiştirmez.
 */
import type {
  CreateProductionOrderCommandContext,
  ProductionOrderReservationContext,
} from '../catalog/command-context.types'
import { productionLineRepository, workshopRepository, getFinishedGoodsWarehouseCode } from '../master-data'
import { saveLifecycleRecord, productionOrderRepo } from './lifecycle-persistence'
import { buildSnapshotsFromContext } from './lifecycle-snapshot-builder'
import { seedFromSalesOrders } from './lifecycle-seed.bootstrap'
import { logCreate, logUpdate, getAuditTrail, type AuditContext } from '../platform/services/audit-service'
import { addTimelineEntry } from '../platform/services/timeline-service'
import { platformPublish, wirePlatformServices } from '../platform/services/platform-orchestrator'
import { scheduleWatcherNotification } from '../platform/services/outbox-scheduler'
import {
  BUSINESS_RULES,
  ruleProductionComplete,
  ruleProductionOrderReservation,
} from '../services/business-rule-engine'
import { createEmptyLedger } from '../services/stock-ledger'
import { createTwinScenario, runTwinScenario } from '../brain/twin/engines/scenario-engine'
import { buildFactoryGraph } from '../brain/twin/engines/factory-graph-engine'
import { createBrainContext } from '../brain/services/brain-kernel'
import { knowledgeLayer } from '../brain/services/knowledge-layer'
import { KEPLER_BRAIN_COMPANY_ID } from '../brain/constants'
import {
  onProductionOrderCreated,
  onProductionOrderStatusChanged,
} from '../execution-platform/execution-provisioning'

import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedProductionDailyEntry, PersistedProductionOrder } from '../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../ports/persistence/persistence.types'

import type {
  DailyProductionEntryRecord,
  ProductionOrderLifecycleRecord,
  ProductionOrderLifecycleStatus,
  ProductionOrderPriority,
} from './lifecycle-types'
import { ALLOWED_NEXT_STATUS, LIFECYCLE_TRANSITIONS } from './lifecycle-types'

function productionDailyRepo() {
  return requireUnitOfWork().productionDailyEntries
}

function stripProductionOrder(row: PersistedProductionOrder): ProductionOrderLifecycleRecord {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

function stripDailyEntry(row: PersistedProductionDailyEntry): DailyProductionEntryRecord {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

function defaultAudit(actor = 'system'): AuditContext {
  return { changedBy: actor, ip: '127.0.0.1', machine: 'lifecycle-service' }
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
  scheduleWatcherNotification({
    entityType: 'ProductionOrder',
    entityId: record.id,
    entityNo: record.productionOrderNo,
    description,
    causedBy: actor,
  })
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
  const page = productionOrderRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripProductionOrder).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getProductionOrderLifecycle(productionOrderNo: string): ProductionOrderLifecycleRecord | undefined {
  seedFromSalesOrders()
  const row = productionOrderRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo)
  return row ? stripProductionOrder(row) : undefined
}

export function createProductionOrderFromSalesOrder(
  context: CreateProductionOrderCommandContext,
  actor: string,
  priority: ProductionOrderPriority = 'Normal',
): ProductionOrderLifecycleRecord {
  seedFromSalesOrders()
  const { salesOrder: order, product, stockCardsById } = context

  const existing = productionOrderRepo()
    .findBySalesOrderId(DEFAULT_TENANT_ID, order.id)
    .map(stripProductionOrder)
    .find((p) => p.status !== 'Cancelled')
  if (existing) throw new Error(`Bu sipariş için UE zaten var: ${existing.productionOrderNo}`)

  const counter = productionOrderRepo().nextProductionOrderCounter()
  const workOrderNo = `UE-2026-${String(counter + 1000).padStart(4, '0')}`
  const snapshots = buildSnapshotsFromContext(order, product, stockCardsById, 1)
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

  saveLifecycleRecord(record)
  logCreate('ProductionOrder', workOrderNo, defaultAudit(actor), { status: 'Draft', salesOrderNo: order.orderNo })
  emitLifecycleEvent(record, 'Üretim emri oluşturuldu (Draft)', actor)
  onProductionOrderCreated(record, actor)
  return record
}

/** @deprecated Use createProductionOrderFromSalesOrder with command context */
export function createProductionOrderFromSalesOrderId(
  _salesOrderId: string,
  _actor: string,
  _priority: ProductionOrderPriority = 'Normal',
): never {
  throw new Error(
    'createProductionOrderFromSalesOrderId deprecated — use application catalog bridge + createProductionOrderFromSalesOrder(context)',
  )
}

export function transitionProductionOrderStatus(
  productionOrderNo: string,
  toStatus: ProductionOrderLifecycleStatus,
  actor: string,
  reservationContext?: ProductionOrderReservationContext,
): ProductionOrderLifecycleRecord {
  seedFromSalesOrders()
  const record = getProductionOrderLifecycle(productionOrderNo)
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
    if (!reservationContext) {
      throw new Error('Released geçişi için reservationContext gerekli (application catalog bridge)')
    }
    const { product, stockCardsById } = reservationContext
    const ledger = createEmptyLedger()
    const result = ruleProductionOrderReservation(
      {
        productionOrderId: record.id,
        productionOrderNo: record.productionOrderNo,
        orderId: record.salesOrderId,
        orderNo: record.salesOrderNo,
        lines: product.bom.map((b) => ({
          stockCardId: b.stockCardId,
          warehouseCode: stockCardsById.get(b.stockCardId)?.warehouseCode ?? 'WH-RM',
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
  saveLifecycleRecord(record)
  onProductionOrderStatusChanged(record, actor)
  return record
}

export function addDailyProductionEntry(
  productionOrderNo: string,
  input: Omit<DailyProductionEntryRecord, 'id' | 'productionOrderNo' | 'recordedAt'>,
): DailyProductionEntryRecord {
  seedFromSalesOrders()
  const record = getProductionOrderLifecycle(productionOrderNo)
  if (!record) throw new Error('Üretim emri bulunamadı')
  if (record.status !== 'In Production' && record.status !== 'Paused') {
    throw new Error('Günlük giriş yalnızca In Production veya Paused durumunda')
  }

  const entry: DailyProductionEntryRecord = {
    id: productionDailyRepo().nextEntryId(),
    productionOrderNo,
    ...input,
    recordedAt: new Date().toISOString(),
  }
  const persisted: PersistedProductionDailyEntry = {
    ...entry,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'production_daily_entry',
    streamId: productionOrderNo,
    sequence: 0,
  }
  productionDailyRepo().append(
    DEFAULT_TENANT_ID,
    { streamType: 'production_daily_entry', streamId: productionOrderNo },
    [persisted],
  )

  record.producedQty += input.produced
  record.rejectQty += input.reject
  record.reworkQty += input.rework
  record.secondQualityQty += input.secondQuality
  record.fireQty += input.fire
  record.updatedAt = new Date().toISOString()
  saveLifecycleRecord(record)

  emitLifecycleEvent(
    record,
    `Günlük giriş: plan ${input.planned}, gerçek ${input.produced}, fire ${input.fire}`,
    input.recordedBy,
  )
  return entry
}

export function getDailyEntriesForOrder(productionOrderNo: string): DailyProductionEntryRecord[] {
  const page = productionDailyRepo().cursorByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo, {
    limit: PERSISTENCE_CURSOR_MAX_LIMIT,
  })
  return page.items.map(stripDailyEntry)
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
