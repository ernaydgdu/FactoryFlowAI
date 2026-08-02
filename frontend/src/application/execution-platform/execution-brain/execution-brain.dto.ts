export type ExecutionBrainInsightDto = {
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

export type ExecutionBrainSummaryDto = {
  activeExecutions: number
  totalBundles: number
  topWipOperation: string
  topWipQty: number
}

export type BundleQueueInsightDto = {
  operationCode: string
  bundleCount: number
}

export type ExecutionBrainViewModel = {
  insight: ExecutionBrainInsightDto | null
  summary: ExecutionBrainSummaryDto
  bundleQueue: BundleQueueInsightDto[]
  availableMetrics: string[]
}
