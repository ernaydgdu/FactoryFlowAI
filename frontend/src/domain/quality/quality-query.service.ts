/**
 * Quality queues & dashboard — derived from qualityGateEvaluations stream
 * + Bundle OnHold status. No new ports.
 */
import { getBundlesForProductionOrder } from '@/domain/execution-platform/bundle-tracking-service'
import { getAllExecutionContexts } from '@/domain/execution-platform/execution-platform-service'
import { getAllExecutionTimelineEvents } from '@/domain/execution-platform/execution-timeline-service'
import { getGateEvaluations } from '@/domain/execution-platform/quality-gate-service'
import type { QualityGateEvaluation } from '@/domain/execution-platform/execution-types'

import { listNcrRecords } from './ncr-capa.service'
import { listQcPlanCoverage, listQcPlanSteps } from './qc-plan.service'
import type { HoldQueueItem, ReworkQueueItem } from './quality.types'

export function listAllGateEvaluations(): QualityGateEvaluation[] {
  return getAllExecutionContexts().flatMap((c) => getGateEvaluations(c.productionOrderNo))
}

export function listReworkQueue(): ReworkQueueItem[] {
  const completed = new Set(
    getAllExecutionTimelineEvents()
      .filter((e) => e.eventType === 'ReworkCompleted')
      .map((e) => `${e.productionOrderNo}|${e.operationCode}|${e.bundleId ?? ''}`),
  )

  return listAllGateEvaluations()
    .filter((e) => e.disposition === 'Rework')
    .map((e) => {
      const key = `${e.productionOrderNo}|${e.operationCode}|${e.bundleId ?? ''}`
      return {
        evaluationId: e.id,
        productionOrderNo: e.productionOrderNo,
        operationCode: e.operationCode,
        gateType: e.gateType,
        bundleId: e.bundleId,
        reworkQty: e.reworkQty,
        evaluatedAt: e.evaluatedAt,
        evaluatedBy: e.evaluatedBy,
        status: completed.has(key) ? ('Completed' as const) : ('Open' as const),
      }
    })
    .filter((r) => r.status === 'Open')
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
}

export function listHoldQueue(): HoldQueueItem[] {
  return getAllExecutionContexts().flatMap((ctx) =>
    getBundlesForProductionOrder(ctx.productionOrderNo)
      .filter((b) => b.status === 'OnHold')
      .map((b) => ({
        bundleId: b.id,
        bundleNo: b.bundleNo,
        productionOrderNo: b.productionOrderNo,
        currentOperationCode: b.currentOperationCode,
        reasonCode: 'QUALITY-HOLD',
        pieceCount: b.pieceCount,
      })),
  )
}

export function getQualityDashboardKpis() {
  const evals = listAllGateEvaluations()
  const rework = listReworkQueue()
  const hold = listHoldQueue()
  const ncrs = listNcrRecords().filter((n) => n.status === 'Open')
  const pass = evals.filter((e) => e.disposition === 'Pass' || e.disposition === 'PassWithCondition').length
  const reject = evals.filter((e) => e.disposition === 'Reject' || e.disposition === 'Scrap').length
  return {
    totalInspections: evals.length,
    passCount: pass,
    rejectCount: reject,
    reworkOpen: rework.length,
    holdOpen: hold.length,
    ncrOpen: ncrs.length,
    planSteps: listQcPlanSteps().length,
    avgCoverage:
      listQcPlanCoverage().length === 0
        ? 0
        : Math.round(
            listQcPlanCoverage().reduce((s, c) => s + c.coveragePercent, 0) / listQcPlanCoverage().length,
          ),
  }
}

const QUALITY_EVENT_TYPES = new Set([
  'QualityPassed',
  'QualityRejected',
  'QualityReworked',
  'QualityGateEvaluated',
  'ReworkCompleted',
  'BundleOnHold',
])

export type QualityTimelineItem = {
  id: string
  occurredAt: string
  eventType: string
  title: string
  description: string
  actor: string
  productionOrderNo: string
  operationCode: string | null
  bundleId: string | null
}

/** Quality Timeline — execution event stream'den kalite olayları. */
export function listQualityTimeline(productionOrderNo?: string): QualityTimelineItem[] {
  return getAllExecutionTimelineEvents()
    .filter((e) => QUALITY_EVENT_TYPES.has(e.eventType))
    .filter((e) => !productionOrderNo || e.productionOrderNo === productionOrderNo)
    .slice()
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 150)
    .map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      actor: e.actor,
      productionOrderNo: e.productionOrderNo,
      operationCode: e.operationCode ?? null,
      bundleId: e.bundleId ?? null,
    }))
}
