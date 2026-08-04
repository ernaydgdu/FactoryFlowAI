/**
 * QC Plan — read-model from TEXTILE_EXECUTION_ROUTE gate points.
 * No new aggregate; plan is the route's required inspections.
 */
import { TEXTILE_EXECUTION_ROUTE } from '@/domain/execution-platform/execution-types'
import { getGateEvaluations } from '@/domain/execution-platform/quality-gate-service'
import { getAllExecutionContexts } from '@/domain/execution-platform/execution-platform-service'

import type { QcPlanStep } from './quality.types'

export function listQcPlanSteps(): QcPlanStep[] {
  return TEXTILE_EXECUTION_ROUTE.filter((s) => s.gateAfter != null).map((s) => ({
    operationCode: s.operationCode,
    sequence: s.sequence,
    gateType: s.gateAfter!,
    required: true as const,
  }))
}

export type QcPlanCoverage = {
  productionOrderNo: string
  productCode: string
  steps: {
    operationCode: string
    gateType: string
    latestDisposition: string | null
    covered: boolean
  }[]
  coveragePercent: number
}

export function getQcPlanCoverage(productionOrderNo: string): QcPlanCoverage | null {
  const ctx = getAllExecutionContexts().find((c) => c.productionOrderNo === productionOrderNo)
  if (!ctx) return null
  const evals = getGateEvaluations(productionOrderNo)
  const steps = listQcPlanSteps().map((step) => {
    const latest = evals
      .filter((e) => e.operationCode === step.operationCode && e.gateType === step.gateType)
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0]
    return {
      operationCode: step.operationCode,
      gateType: step.gateType,
      latestDisposition: latest?.disposition ?? null,
      covered: !!latest && (latest.disposition === 'Pass' || latest.disposition === 'PassWithCondition' || latest.disposition === 'SecondQuality'),
    }
  })
  const covered = steps.filter((s) => s.covered).length
  return {
    productionOrderNo,
    productCode: ctx.productCode,
    steps,
    coveragePercent: steps.length > 0 ? Math.round((covered / steps.length) * 100) : 0,
  }
}

export function listQcPlanCoverage(): QcPlanCoverage[] {
  return getAllExecutionContexts()
    .map((c) => getQcPlanCoverage(c.productionOrderNo))
    .filter((c): c is QcPlanCoverage => c != null)
}
