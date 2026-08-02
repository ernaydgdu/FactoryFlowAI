import {
  analyzeExecutionForBrain,
  getBundleQueueInsight,
  getExecutionPlatformBrainSummary,
  listExecutionBrainMetrics,
} from '@/domain/execution-platform/execution-brain-query'

import type { ExecutionBrainViewModel } from './execution-brain.dto'

export function queryExecutionBrain(productionOrderNo: string): ExecutionBrainViewModel {
  return {
    insight: analyzeExecutionForBrain(productionOrderNo),
    summary: getExecutionPlatformBrainSummary(),
    bundleQueue: getBundleQueueInsight(productionOrderNo),
    availableMetrics: listExecutionBrainMetrics(),
  }
}

export function queryExecutionBrainInsight(productionOrderNo: string) {
  return analyzeExecutionForBrain(productionOrderNo)
}

export function queryExecutionBrainSummary() {
  return getExecutionPlatformBrainSummary()
}

export function queryBundleQueueInsight(productionOrderNo: string) {
  return getBundleQueueInsight(productionOrderNo)
}

export function queryExecutionBrainMetrics() {
  return listExecutionBrainMetrics()
}
