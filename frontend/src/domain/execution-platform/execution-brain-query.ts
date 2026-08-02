/**
 * Execution Platform Brain Query — READ ONLY
 */
import { getOperationExecutions, getParallelExecutionCapability } from './operation-execution-service'
import { getBundleWaitTimes, getBundlesForProductionOrder } from './bundle-tracking-service'
import { getGlobalWipDensity, getWipPositions } from './wip-query-service'
import { getWorkSessions } from './operation-work-session-service'
import { getGateEvaluations } from './quality-gate-service'
import {
  getAllExecutionContexts,
  getExecutionContext,
  getOperationDailyEntries,
  getWipSummaryForOrder,
} from './execution-platform-service'
import { getAllSplitExecutions } from './split-execution-service'
import { getWorkshopCapacitySnapshots } from '../services/planning/capacity-engine'
import { getProductionOrderLifecycle } from '../production-order/lifecycle-service'

export type ExecutionBrainInsight = {
  productionOrderNo: string
  wipDensity: number
  bottleneckOperation: string
  bottleneckOperationName: string
  bundleWaitAvgMinutes: number
  operationEfficiency: number
  fireAnomaly: boolean
  reworkIntensity: number
  qualityYield: number
  estimatedFinishDate: string
  delayReason: string
  bestLineRecommendation: string
  splitRecommendation: string | null
  parallelSessions: number
  lineEfficiency: number
  machineUtilization: number
  queueLength: number
}

export type ExecutionBrainMetricCatalog = {
  currentWip: boolean
  waitingTime: boolean
  lineEfficiency: boolean
  bundleAge: boolean
  operationDuration: boolean
  queueLength: boolean
  reworkRatio: boolean
  qualityYield: boolean
  machineUtilization: boolean
  shiftProductivity: boolean
  oee: boolean
  cutToSewRatio: boolean
  parallelExecution: boolean
}

export const EXECUTION_BRAIN_METRICS: ExecutionBrainMetricCatalog = {
  currentWip: true,
  waitingTime: true,
  lineEfficiency: true,
  bundleAge: true,
  operationDuration: true,
  queueLength: true,
  reworkRatio: true,
  qualityYield: true,
  machineUtilization: true,
  shiftProductivity: true,
  oee: true,
  cutToSewRatio: true,
  parallelExecution: true,
}

export function analyzeExecutionForBrain(productionOrderNo: string): ExecutionBrainInsight | null {
  const context = getExecutionContext(productionOrderNo)
  if (!context) return null

  const wip = getWipSummaryForOrder(productionOrderNo)
  const ops = getOperationExecutions(productionOrderNo)
  const bundleWaits = getBundleWaitTimes(productionOrderNo)
  const entries = getOperationDailyEntries(productionOrderNo)
  const po = getProductionOrderLifecycle(productionOrderNo)
  const wipPositions = getWipPositions(productionOrderNo)
  const gates = getGateEvaluations(productionOrderNo)
  const sessions = getWorkSessions(productionOrderNo)

  const bottleneck = wip.byOperation[0]
  const totalProduced = ops.reduce((s, o) => s + o.completedQty, 0)
  const totalPlanned = context.plannedQty
  const progress = totalPlanned > 0 ? totalProduced / totalPlanned : 0

  const totalFire = entries.reduce((s, e) => s + e.fire, 0)
  const totalRework = entries.reduce((s, e) => s + e.rework, 0)
  const fireRate = totalProduced > 0 ? totalFire / totalProduced : 0
  const reworkRate = totalProduced > 0 ? totalRework / totalProduced : 0

  const passGates = gates.filter((g) => ['Pass', 'PassWithCondition', 'SecondQuality'].includes(g.disposition)).length
  const qualityYield = gates.length > 0 ? Math.round((passGates / gates.length) * 100) : 100

  const avgWait =
    bundleWaits.length > 0
      ? Math.round(bundleWaits.reduce((s, b) => s + b.waitMinutes, 0) / bundleWaits.length)
      : 0

  const remaining = Math.max(0, totalPlanned - totalProduced)
  const dailyRate = entries.length > 0 ? entries.reduce((s, e) => s + e.produced, 0) / entries.length : 100
  const daysLeft = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : 99
  const finish = new Date()
  finish.setDate(finish.getDate() + daysLeft)

  const workshops = getWorkshopCapacitySnapshots()
  const best = [...workshops].sort((a, b) => b.remaining - a.remaining)[0]

  const splits = getAllSplitExecutions().filter((s) => s.parentProductionOrderNo === productionOrderNo)
  const splitRec =
    progress < 0.4 && (po?.snapshots.planning.terminRiskScore ?? 0) >= 60 && splits.length === 0
      ? `Split önerisi: ${best?.name ?? 'FSN-B'} — boş kapasite ${best?.remaining ?? 0}`
      : null

  let delayReason = 'Gecikme tespit edilmedi'
  if (progress < 0.5 && context.status === 'Active') {
    delayReason = bottleneck
      ? `Darboğaz: ${bottleneck.operationName} — ${bottleneck.totalQty} adet WIP`
      : 'İlerleme yavaş'
  }
  if (avgWait > 120) delayReason += `; Bundle bekleme ort. ${avgWait} dk`

  const activeSessions = sessions.filter((s) => s.status === 'InProgress').length
  const sewParallel = getParallelExecutionCapability(productionOrderNo, 'SEW')
  const lineEfficiency =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((s, ws) => s + ws.completedQty, 0) /
            Math.max(1, sessions.reduce((s, ws) => s + ws.plannedQty, 0))) *
            100,
        )
      : Math.round(progress * 100)

  const machineUtilization =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s) => s.status === 'InProgress').length / sessions.length) * 100,
        )
      : 0

  const queueLength = wipPositions.filter((p) => p.state === 'Queued').length

  return {
    productionOrderNo,
    wipDensity: wip.totalWipQty,
    bottleneckOperation: bottleneck?.operationCode ?? '—',
    bottleneckOperationName: bottleneck?.operationName ?? '—',
    bundleWaitAvgMinutes: avgWait,
    operationEfficiency: Math.round(progress * 100),
    fireAnomaly: fireRate > 0.05,
    reworkIntensity: Math.round(reworkRate * 100),
    qualityYield,
    estimatedFinishDate: finish.toISOString().slice(0, 10),
    delayReason,
    bestLineRecommendation: best ? `${best.name} — ${best.remaining} boş kapasite` : '—',
    splitRecommendation: splitRec,
    parallelSessions: activeSessions + sewParallel.activeSessions,
    lineEfficiency,
    machineUtilization,
    queueLength,
  }
}

export function getExecutionPlatformBrainSummary() {
  const contexts = getAllExecutionContexts()
  const globalWip = getGlobalWipDensity()
  return {
    activeExecutions: contexts.filter((c) => c.status === 'Active').length,
    totalBundles: contexts.reduce((s, c) => s + c.bundleCount, 0),
    topWipOperation: globalWip[0]?.operationCode ?? '—',
    topWipQty: globalWip[0]?.totalQty ?? 0,
  }
}

export function getBundleQueueInsight(productionOrderNo: string) {
  const bundles = getBundlesForProductionOrder(productionOrderNo)
  const byOp = new Map<string, number>()
  for (const b of bundles) {
    const op = b.currentOperationCode ?? 'UNKNOWN'
    byOp.set(op, (byOp.get(op) ?? 0) + 1)
  }
  return [...byOp.entries()].map(([operationCode, count]) => ({ operationCode, bundleCount: count }))
}

export function listExecutionBrainMetrics(): string[] {
  return Object.entries(EXECUTION_BRAIN_METRICS)
    .filter(([, available]) => available)
    .map(([key]) => key)
}
