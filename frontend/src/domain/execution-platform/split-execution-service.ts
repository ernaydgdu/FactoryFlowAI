/**
 * Split Execution Service — BR-11 lifecycle entegrasyonu
 */
import { resolveCreateBundlesContextForProvisioning } from '../catalog/provisioning-catalog.bridge'
import type { ProductCard, SalesOrder } from '../types'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedSplitExecution } from '../ports/persistence/persistence-aggregates'
import {
  buildSplitProductionInput,
  buildSplitProductionOrders,
  planSplitCapacity,
  seedSplitTimeline,
} from '../services/production-split-service'
import { ruleProductionOrderSplit } from '../services/business-rule-engine'
import { createEmptyLedger } from '../services/stock-ledger'
import { getProductionOrderLifecycle } from '../production-order/lifecycle-service'
import type { SplitExecutionRecord } from './execution-types'
import { initializeExecutionPlatform } from './execution-platform-service'
import { emitExecutionEvent } from './execution-timeline-service'

function splitRepo() {
  return requireUnitOfWork().splitExecutions
}

function stripSplitMeta(row: PersistedSplitExecution): SplitExecutionRecord {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    updatedAt: _u,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

export function getSplitExecutions(parentProductionOrderNo: string): SplitExecutionRecord[] {
  return splitRepo()
    .findByParentProductionOrderNo(DEFAULT_TENANT_ID, parentProductionOrderNo)
    .map(stripSplitMeta)
}

export function executeSplitProduction(input: {
  parentProductionOrderNo: string
  workshopCodes: string[]
  actor: string
}): SplitExecutionRecord[] {
  const parentPo = getProductionOrderLifecycle(input.parentProductionOrderNo)
  if (!parentPo) throw new Error('Parent UE bulunamadı')

  const existing = getSplitExecutions(input.parentProductionOrderNo)
  if (existing.length > 0) return existing

  const catalog = resolveCreateBundlesContextForProvisioning(
    parentPo.salesOrderId,
    parentPo.productCode,
  )
  const order = catalog.salesOrder as SalesOrder
  const product = catalog.product as ProductCard

  const splits = buildSplitProductionOrders(order, input.workshopCodes)
  const splitInput = buildSplitProductionInput(order, splits, product.bom, input.actor)
  const ledger = createEmptyLedger()
  const brResult = ruleProductionOrderSplit(splitInput, ledger)
  if (!brResult.success) {
    throw new Error(brResult.errors?.join('; ') ?? 'BR-11 split başarısız')
  }

  seedSplitTimeline(order, splits)
  void planSplitCapacity(order, input.workshopCodes)

  const parentContext = initializeExecutionPlatform(input.parentProductionOrderNo, input.actor)
  const records: SplitExecutionRecord[] = []

  for (const split of splits) {
    const childContext = initializeExecutionPlatform(split.workOrderNo, input.actor, {
      parentProductionOrderNo: input.parentProductionOrderNo,
      splitIndex: split.splitIndex,
      splitOfTotal: split.splitOfTotal,
      workshopCode: split.workshopCode,
      plannedQty: split.plannedQty,
      salesOrderId: parentPo.salesOrderId,
      salesOrderNo: parentPo.salesOrderNo,
      productCode: parentPo.productCode,
    })

    const record: SplitExecutionRecord = {
      id: splitRepo().nextSplitId(),
      parentProductionOrderNo: input.parentProductionOrderNo,
      parentExecutionContextId: parentContext.id,
      childProductionOrderNo: split.workOrderNo,
      childExecutionContextId: childContext.id,
      splitIndex: split.splitIndex,
      splitOfTotal: split.splitOfTotal,
      workshopCode: split.workshopCode,
      plannedQty: split.plannedQty,
      br11Applied: true,
      createdAt: new Date().toISOString(),
      createdBy: input.actor,
    }

    const now = record.createdAt
    splitRepo().save(DEFAULT_TENANT_ID, {
      ...record,
      tenantId: DEFAULT_TENANT_ID,
      version: 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    records.push(record)

    emitExecutionEvent({
      executionContextId: childContext.id,
      productionOrderNo: split.workOrderNo,
      salesOrderId: parentPo.salesOrderId,
      salesOrderNo: parentPo.salesOrderNo,
      eventType: 'SplitChildActivated',
      title: `Split UE ${split.workOrderNo}`,
      description: `${split.workshopName}: ${split.plannedQty} adet (${split.splitIndex}/${split.splitOfTotal})`,
      actor: input.actor,
      metadata: { parentProductionOrderNo: input.parentProductionOrderNo, br11: true },
    })
  }

  emitExecutionEvent({
    executionContextId: parentContext.id,
    productionOrderNo: input.parentProductionOrderNo,
    salesOrderId: parentPo.salesOrderId,
    salesOrderNo: parentPo.salesOrderNo,
    eventType: 'SplitExecuted',
    title: 'Production Split (BR-11)',
    description: `${splits.length} atölyeye bölündü`,
    actor: input.actor,
    metadata: { childCount: splits.length, movements: brResult.movements.length },
  })

  return records
}

export function getAllSplitExecutions(): SplitExecutionRecord[] {
  const page = splitRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: 1000 })
  return page.items.map(stripSplitMeta)
}
