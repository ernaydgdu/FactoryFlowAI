import {
  getAllExecutionContexts,
  getExecutionContext,
} from '@/domain/execution-platform/execution-platform-service'

import { queryExecutionBrainSummary } from '../execution-brain/execution-brain.mapper'
import { syncExecutionPlatformBeforeQuery } from '../shared/execution-sync'
import { mapExecutionContextStatusBadge } from '../shared/presentation.mapper'
import type { ExecutionContextListItemDto, ExecutionDashboardViewModel } from './dashboard.dto'

function mapContextItem(ctx: ReturnType<typeof getExecutionContext>): ExecutionContextListItemDto | null {
  if (!ctx) return null
  return {
    productionOrderNo: ctx.productionOrderNo,
    salesOrderNo: ctx.salesOrderNo,
    productCode: ctx.productCode,
    workshopCode: ctx.workshopCode,
    lineId: ctx.lineId,
    plannedQty: ctx.plannedQty,
    bundleCount: ctx.bundleCount,
    status: mapExecutionContextStatusBadge(ctx.status),
    initializedAt: ctx.initializedAt,
  }
}

export function queryExecutionDashboard(): ExecutionDashboardViewModel {
  syncExecutionPlatformBeforeQuery()
  const contexts = getAllExecutionContexts()
  const brain = queryExecutionBrainSummary()
  return {
    kpis: [
      { label: 'Aktif Execution', value: String(brain.activeExecutions), hint: 'Platform' },
      { label: 'Toplam Bundle', value: String(brain.totalBundles), hint: 'Shop floor' },
      { label: 'En Yoğun Op', value: brain.topWipOperation, hint: 'WIP' },
      { label: 'WIP Adet', value: String(brain.topWipQty), hint: 'Darboğaz' },
    ],
    activeContexts: contexts
      .filter((c) => c.status === 'Active')
      .map((c) => mapContextItem(c)!),
    topWipOperation: brain.topWipOperation,
    topWipQty: brain.topWipQty,
  }
}

export function queryExecutionContextList(): ExecutionContextListItemDto[] {
  syncExecutionPlatformBeforeQuery()
  return getAllExecutionContexts().map((c) => mapContextItem(c)!)
}

export function queryExecutionContext(productionOrderNo: string): ExecutionContextListItemDto | null {
  syncExecutionPlatformBeforeQuery()
  return mapContextItem(getExecutionContext(productionOrderNo))
}
