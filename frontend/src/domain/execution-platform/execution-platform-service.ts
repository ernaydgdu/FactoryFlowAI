/**
 * Execution Platform Service — orchestrator (engine değil)
 */
import { getSalesOrderById } from '../data/orders'
import { getProductById } from '../data/products'
import { productionLineRepository } from '../master-data'
import { ruleProductionEntry } from '../services/business-rule-engine'
import { createEmptyLedger } from '../services/stock-ledger'
import { getProductionOrderLifecycle } from '../production-order/lifecycle-service'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import { productionCalendarRepo } from '../platform/platform-persistence-access'
import type { PersistedExecutionContext, PersistedOperationDailyEntry } from '../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../ports/persistence/persistence.types'
import type {
  ExecutionContext,
  OperationDailyEntry,
  ProductionCalendarSlot,
  WipPosition,
} from './execution-types'
import {
  completeOperation,
  createOperationExecutions,
  getOperationExecutions,
  startOperation,
} from './operation-execution-service'
import {
  createBundlesFromMatrix,
  getBundlesForProductionOrder,
  issueBundleToFloor,
  moveBundleToOperation,
  printBundleTicket,
} from './bundle-tracking-service'
import { resolveCreateBundlesContextForProvisioning } from '../catalog/provisioning-catalog.bridge'
import { buildWipSummary, getWipTransfers, setWipPositions } from './wip-query-service'
import { scheduleWipRefresh } from '../platform/services/outbox-scheduler'
import { PERSISTENCE_WIP_SYNC_FALLBACK } from '../ports/persistence/persistence-feature-flags'
import { canProceedToOperation } from './quality-gate-service'
import { emitExecutionEvent, getExecutionTimeline } from './execution-timeline-service'
import { getWorkSessions } from './operation-work-session-service'
import { logExecutionCreate } from './execution-audit-service'

import { EXECUTION_SCHEMA_VERSION, TEXTILE_EXECUTION_ROUTE } from './execution-types'

function executionContextRepo() {
  return requireUnitOfWork().executionContexts
}

function operationDailyRepo() {
  return requireUnitOfWork().operationDailyEntries
}

function stripContext(row: PersistedExecutionContext): ExecutionContext {
  const {
    tenantId: _t,
    version: _v,
    updatedAt: _u,
    deletedAt: _d,
    operationExecutions: _oe,
    ...rest
  } = row
  return rest
}

function stripDailyEntry(row: PersistedOperationDailyEntry): OperationDailyEntry {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

function saveContext(context: ExecutionContext): ExecutionContext {
  const existing = executionContextRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, context.productionOrderNo)
  const now = new Date().toISOString()
  const persisted: PersistedExecutionContext = {
    ...context,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: context.schemaVersion,
    createdAt: existing?.createdAt ?? context.initializedAt,
    updatedAt: now,
    deletedAt: null,
    operationExecutions: existing?.operationExecutions ?? [],
  }
  executionContextRepo().save(DEFAULT_TENANT_ID, persisted)
  return context
}

export function getExecutionContext(productionOrderNo: string): ExecutionContext | undefined {
  const row = executionContextRepo().findByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo)
  return row ? stripContext(row) : undefined
}

export function getAllExecutionContexts(): ExecutionContext[] {
  const page = executionContextRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripContext)
}

export function initializeExecutionPlatform(
  productionOrderNo: string,
  actor: string,
  options?: {
    parentProductionOrderNo?: string
    splitIndex?: number
    splitOfTotal?: number
    workshopCode?: string
    plannedQty?: number
    salesOrderId?: string
    salesOrderNo?: string
    productCode?: string
  },
): ExecutionContext {
  const existing = getExecutionContext(productionOrderNo)
  if (existing) return existing

  const po = getProductionOrderLifecycle(productionOrderNo)
  if (!po && options?.plannedQty == null) {
    throw new Error(`UE bulunamadı: ${productionOrderNo}. Önce lifecycle UE oluşturulmalı.`)
  }

  const salesOrderId = po?.salesOrderId ?? options?.salesOrderId ?? ''
  const salesOrderNo = po?.salesOrderNo ?? options?.salesOrderNo ?? ''
  const productCode = po?.productCode ?? options?.productCode ?? '—'
  const workshopCode = options?.workshopCode ?? po?.workshopCode ?? 'FSN-A'
  const lineId = po?.productionLineId ?? productionLineRepository.getActive()[0]?.id ?? null
  const plannedQty = options?.plannedQty ?? po?.plannedQty ?? 0

  const context: ExecutionContext = {
    id: executionContextRepo().nextContextId(),
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    productionOrderNo,
    parentProductionOrderNo: options?.parentProductionOrderNo ?? null,
    salesOrderId,
    salesOrderNo,
    productCode,
    workshopCode,
    lineId,
    status: 'Active',
    routeVersion: 1,
    splitIndex: options?.splitIndex ?? null,
    splitOfTotal: options?.splitOfTotal ?? null,
    plannedQty,
    bundleCount: 0,
    initializedAt: new Date().toISOString(),
    completedAt: null,
    metadata: {},
  }
  saveContext(context)

  createOperationExecutions({
    executionContextId: context.id,
    productionOrderNo,
    workshopCode,
    lineId,
    plannedQty,
  })

  seedProductionCalendar(context)
  scheduleWipRefresh(productionOrderNo, actor)

  emitExecutionEvent({
    executionContextId: context.id,
    productionOrderNo,
    salesOrderId,
    salesOrderNo,
    eventType: 'ExecutionInitialized',
    title: 'Execution Platform başlatıldı',
    description: `${TEXTILE_EXECUTION_ROUTE.length} operasyon, plan ${plannedQty} adet`,
    actor,
  })

  logExecutionCreate('ExecutionContext', context.id, {
    actor,
    productionOrderNo,
    executionContextId: context.id,
  }, { plannedQty, workshopCode })

  return context
}

export function runCuttingAndBundlePhase(productionOrderNo: string, actor: string): {
  bundlesCreated: number
  ticketsPrinted: number
} {
  const context = getExecutionContext(productionOrderNo)
  if (!context) throw new Error('Execution context bulunamadı')

  startOperation({
    productionOrderNo,
    operationCode: 'CUT',
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })
  completeOperation({
    productionOrderNo,
    operationCode: 'CUT',
    completedQty: context.plannedQty,
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })

  startOperation({
    productionOrderNo,
    operationCode: 'PATTERN',
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })
  completeOperation({
    productionOrderNo,
    operationCode: 'PATTERN',
    completedQty: context.plannedQty,
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })

  startOperation({
    productionOrderNo,
    operationCode: 'NUMBER',
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })
  completeOperation({
    productionOrderNo,
    operationCode: 'NUMBER',
    completedQty: context.plannedQty,
    actor,
    executionContextId: context.id,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
  })

  const bundles = createBundlesFromMatrix({
    executionContextId: context.id,
    productionOrderNo,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
    productCode: context.productCode,
    workshopCode: context.workshopCode,
    actor,
    catalogContext: resolveCreateBundlesContextForProvisioning(
      context.salesOrderId,
      context.productCode,
    ),
  })

  let ticketsPrinted = 0
  for (const bundle of bundles) {
    printBundleTicket(bundle.id, actor)
    issueBundleToFloor(bundle.id, actor)
    moveBundleToOperation({
      bundleId: bundle.id,
      toOperationCode: 'SEW',
      workshopCode: context.workshopCode,
      lineId: context.lineId,
      actor,
    })
    ticketsPrinted += 1
  }

  context.bundleCount = bundles.length
  saveContext(context)
  scheduleWipRefresh(productionOrderNo, actor)

  return { bundlesCreated: bundles.length, ticketsPrinted }
}

export function postOperationDailyEntry(input: {
  productionOrderNo: string
  operationCode: string
  lineId: string
  operatorId: string
  machineId: string
  shiftCode: string
  bundleId?: string | null
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  downtimeMinutes: number
  reasonCode?: string | null
  recordedBy: string
}): OperationDailyEntry {
  const context = getExecutionContext(input.productionOrderNo)
  if (!context) throw new Error('Execution context bulunamadı')

  const ops = getOperationExecutions(input.productionOrderNo)
  const check = canProceedToOperation(ops, input.operationCode, input.productionOrderNo)
  if (!check.allowed) throw new Error(check.reason ?? 'Operasyon girişi bloklu')

  const entry: OperationDailyEntry = {
    id: operationDailyRepo().nextEntryId(),
    executionContextId: context.id,
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
    lineId: input.lineId,
    operatorId: input.operatorId,
    machineId: input.machineId,
    shiftCode: input.shiftCode,
    bundleId: input.bundleId ?? null,
    entryDate: input.entryDate,
    planned: input.planned,
    produced: input.produced,
    reject: input.reject,
    rework: input.rework,
    secondQuality: input.secondQuality,
    fire: input.fire,
    downtimeMinutes: input.downtimeMinutes,
    reasonCode: input.reasonCode ?? null,
    posted: false,
    recordedBy: input.recordedBy,
    recordedAt: new Date().toISOString(),
  }

  const order = getSalesOrderById(context.salesOrderId)
  const product = order ? getProductById(order.productCardId) : undefined
  const fabricLine = product?.bom[0]
  const ledger = createEmptyLedger()
  const transferredQty = context.plannedQty

  if (fabricLine && input.produced > 0) {
    const brResult = ruleProductionEntry(
      {
        productionOrderId: context.id,
        productionOrderNo: input.productionOrderNo,
        orderId: context.salesOrderId,
        orderNo: context.salesOrderNo,
        stockCardId: fabricLine.stockCardId,
        workshopWarehouseCode: context.workshopCode,
        plannedQty: input.planned,
        producedQty: input.produced,
        wasteQty: input.fire,
        consumptionPerUnit: fabricLine.actualConsumption,
        unit: 'm',
        wasteMaterialQty: input.fire > 0 ? Math.round(input.fire * fabricLine.actualConsumption * 100) / 100 : 0,
      },
      ledger,
      transferredQty,
      input.recordedBy,
    )
    if (!brResult.success) {
      throw new Error(brResult.errors?.join('; ') ?? 'BR-05/06/07 başarısız')
    }
  }

  entry.posted = true
  const persisted: PersistedOperationDailyEntry = {
    ...entry,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'operation_daily_entry',
    streamId: input.productionOrderNo,
    sequence: 0,
  }
  operationDailyRepo().append(
    DEFAULT_TENANT_ID,
    { streamType: 'operation_daily_entry', streamId: input.productionOrderNo },
    [persisted],
  )

  const opExec = ops.find((o) => o.operationCode === input.operationCode)
  if (opExec?.status === 'Ready' || opExec?.status === 'Pending') {
    startOperation({
      productionOrderNo: input.productionOrderNo,
      operationCode: input.operationCode,
      actor: input.recordedBy,
      executionContextId: context.id,
      salesOrderId: context.salesOrderId,
      salesOrderNo: context.salesOrderNo,
      lineId: input.lineId,
    })
  }

  const currentOp = getOperationExecutions(input.productionOrderNo).find(
    (o) => o.operationCode === input.operationCode,
  )
  if (currentOp && (currentOp.status === 'InProgress' || currentOp.status === 'Paused')) {
    completeOperation({
      productionOrderNo: input.productionOrderNo,
      operationCode: input.operationCode,
      completedQty: input.produced,
      wasteQty: input.fire,
      reworkQty: input.rework,
      secondQualityQty: input.secondQuality,
      actor: input.recordedBy,
      executionContextId: context.id,
      salesOrderId: context.salesOrderId,
      salesOrderNo: context.salesOrderNo,
    })
  }

  scheduleWipRefresh(input.productionOrderNo, input.recordedBy)

  emitExecutionEvent({
    executionContextId: context.id,
    productionOrderNo: input.productionOrderNo,
    salesOrderId: context.salesOrderId,
    salesOrderNo: context.salesOrderNo,
    eventType: 'DailyEntryPosted',
    title: `Günlük giriş — ${input.operationCode}`,
    description: `Üretilen ${input.produced}, fire ${input.fire}, vardiya ${input.shiftCode}`,
    actor: input.recordedBy,
    operationCode: input.operationCode,
    bundleId: input.bundleId ?? undefined,
    metadata: { operatorId: input.operatorId, machineId: input.machineId },
  })

  return entry
}

export function getOperationDailyEntries(productionOrderNo: string): OperationDailyEntry[] {
  const page = operationDailyRepo().cursorByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo, {
    limit: PERSISTENCE_CURSOR_MAX_LIMIT,
  })
  return page.items.map(stripDailyEntry)
}

export function rebuildWipIndex(productionOrderNo: string): WipPosition[] {
  const context = getExecutionContext(productionOrderNo)
  if (!context) return []

  const positions: WipPosition[] = []
  const now = new Date().toISOString()
  const bundles = getBundlesForProductionOrder(productionOrderNo)
  const ops = getOperationExecutions(productionOrderNo)
  const transfers = getWipTransfers(productionOrderNo)
  const sessions = getWorkSessions(productionOrderNo)

  const queueByOp = new Map<string, number>()
  for (const bundle of bundles) {
    if (bundle.status === 'Scrapped' || bundle.status === 'Completed' || bundle.status === 'Cancelled' || bundle.status === 'Lost') continue
    const opCode = bundle.currentOperationCode ?? 'SEW'
    const opExec = ops.find((o) => o.operationCode === opCode)
    let state: WipPosition['state'] = 'Queued'
    if (opExec?.status === 'InProgress') state = 'InProcess'
    if (opExec?.status === 'Blocked') state = 'Blocked'
    if (opExec?.requiredGate && !opExec.gatePassed && opExec.status === 'Completed') state = 'WaitingQC'
    if (bundle.status === 'OnHold') state = 'Blocked'

    const activeSession = sessions.find(
      (s) =>
        s.status === 'InProgress' &&
        s.operationCode === opCode &&
        (s.bundleIds.includes(bundle.id) || s.lineId === bundle.currentLineId),
    )

    const lastTransfer = [...transfers]
      .filter((t) => t.bundleId === bundle.id)
      .sort((a, b) => b.transferredAt.localeCompare(a.transferredAt))[0]

    const queuePos = (queueByOp.get(opCode) ?? 0) + 1
    queueByOp.set(opCode, queuePos)

    const locationCode = bundle.currentLineId
      ? `LINE-${bundle.currentLineId}-QUEUE`
      : `WIP-${bundle.currentWorkshopCode ?? context.workshopCode}`

    positions.push({
      id: `wip-${bundle.id}-${opCode}`,
      executionContextId: context.id,
      productionOrderNo,
      operationCode: opCode,
      bundleId: bundle.id,
      workshopCode: bundle.currentWorkshopCode ?? context.workshopCode,
      lineId: bundle.currentLineId,
      machineId: activeSession?.machineId ?? null,
      operatorId: activeSession?.operatorId ?? null,
      shiftCode: activeSession?.shiftCode ?? null,
      quantity: bundle.pieceCount,
      state,
      startedAt: activeSession?.startedAt ?? bundle.issuedAt,
      waitingSince: bundle.issuedAt,
      lastTransferId: lastTransfer?.id ?? null,
      waitingReasonCode: (bundle.metadata.holdReason as string) ?? (bundle.metadata.waitingReason as string) ?? null,
      currentLocationCode: locationCode,
      currentQueuePosition: queuePos,
      estimatedReleaseTime: activeSession
        ? new Date(Date.now() + 60 * 60_000).toISOString()
        : null,
      updatedAt: now,
    })
  }

  for (const op of ops) {
    if (op.status === 'InProgress' && op.completedQty > 0) {
      const opSessions = sessions.filter((s) => s.operationCode === op.operationCode && s.status === 'InProgress')
      positions.push({
        id: `wip-op-${op.id}`,
        executionContextId: context.id,
        productionOrderNo,
        operationCode: op.operationCode,
        bundleId: null,
        workshopCode: op.workshopCode,
        lineId: op.lineId,
        machineId: opSessions[0]?.machineId ?? null,
        operatorId: opSessions[0]?.operatorId ?? null,
        shiftCode: opSessions[0]?.shiftCode ?? null,
        quantity: op.completedQty,
        state: 'InProcess',
        startedAt: op.startedAt,
        waitingSince: op.startedAt,
        lastTransferId: null,
        waitingReasonCode: null,
        currentLocationCode: op.lineId ? `LINE-${op.lineId}-ACTIVE` : null,
        currentQueuePosition: null,
        estimatedReleaseTime: null,
        updatedAt: now,
      })
    }
  }

  setWipPositions([
    ...positions,
    ...getWipForOtherOrders(productionOrderNo),
  ])

  return positions
}

function getWipForOtherOrders(excludePo: string): WipPosition[] {
  const result: WipPosition[] = []
  for (const ctx of getAllExecutionContexts()) {
    const poNo = ctx.productionOrderNo
    if (poNo === excludePo) continue
    const bundles = getBundlesForProductionOrder(poNo)
    for (const b of bundles) {
      if (b.status === 'Completed' || b.status === 'Scrapped') continue
      result.push({
        id: `wip-${b.id}-${b.currentOperationCode}`,
        executionContextId: ctx.id,
        productionOrderNo: poNo,
        operationCode: b.currentOperationCode ?? 'SEW',
        bundleId: b.id,
        workshopCode: b.currentWorkshopCode ?? ctx.workshopCode,
        lineId: b.currentLineId,
        machineId: null,
        operatorId: null,
        shiftCode: null,
        quantity: b.pieceCount,
        state: 'Queued',
        startedAt: b.issuedAt,
        waitingSince: b.issuedAt,
        lastTransferId: null,
        waitingReasonCode: null,
        currentLocationCode: b.currentLineId ? `LINE-${b.currentLineId}-QUEUE` : null,
        currentQueuePosition: null,
        estimatedReleaseTime: null,
        updatedAt: new Date().toISOString(),
      })
    }
  }
  return result
}

export function getWipSummaryForOrder(productionOrderNo: string) {
  const ops = getOperationExecutions(productionOrderNo)
  const names = new Map(ops.map((o) => [o.operationCode, o.operationName]))
  if (PERSISTENCE_WIP_SYNC_FALLBACK) {
    rebuildWipIndex(productionOrderNo)
  }
  return buildWipSummary(productionOrderNo, names)
}

function seedProductionCalendar(context: ExecutionContext): void {
  const repo = productionCalendarRepo()
  const line = productionLineRepository.getById(context.lineId ?? '') ?? productionLineRepository.getActive()[0]
  const today = new Date().toISOString().slice(0, 10)
  const slots: ProductionCalendarSlot[] = []

  for (const step of TEXTILE_EXECUTION_ROUTE) {
    if (['CUT', 'PATTERN', 'NUMBER'].includes(step.operationCode)) continue
    slots.push({
      id: repo.nextId(DEFAULT_TENANT_ID),
      productionOrderNo: context.productionOrderNo,
      lineId: line?.id ?? 'pl-1',
      lineCode: line?.code ?? 'LINE-1',
      operationCode: step.operationCode,
      slotDate: today,
      hourStart: 8 + Math.floor(step.sequence / 10),
      hourEnd: 9 + Math.floor(step.sequence / 10),
      plannedQty: Math.floor(context.plannedQty / 5),
      actualQty: 0,
      status: 'Planned',
    })
  }

  repo.append(DEFAULT_TENANT_ID, slots)
}

export function getProductionCalendar(productionOrderNo?: string): ProductionCalendarSlot[] {
  const repo = productionCalendarRepo()
  if (productionOrderNo) return repo.getByProductionOrder(DEFAULT_TENANT_ID, productionOrderNo)
  return repo.getAll(DEFAULT_TENANT_ID)
}

export function getFullExecutionState(productionOrderNo: string) {
  const context = getExecutionContext(productionOrderNo)
  if (!context) return null
  return {
    context,
    operations: getOperationExecutions(productionOrderNo),
    workSessions: getWorkSessions(productionOrderNo),
    bundles: getBundlesForProductionOrder(productionOrderNo),
    wip: getWipSummaryForOrder(productionOrderNo),
    dailyEntries: getOperationDailyEntries(productionOrderNo),
    timeline: getExecutionTimeline(productionOrderNo),
    calendar: getProductionCalendar(productionOrderNo),
  }
}

export { getExecutionTimeline }
