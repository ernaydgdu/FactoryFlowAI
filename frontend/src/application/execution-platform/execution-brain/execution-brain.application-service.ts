import {
  queryBundleQueueInsight,
  queryExecutionBrain,
  queryExecutionBrainInsight,
  queryExecutionBrainMetrics,
  queryExecutionBrainSummary,
} from './execution-brain.mapper'

export const executionBrainApplicationService = {
  query: {
    getView: queryExecutionBrain,
    getInsight: queryExecutionBrainInsight,
    getSummary: queryExecutionBrainSummary,
    getBundleQueue: queryBundleQueueInsight,
    getMetrics: queryExecutionBrainMetrics,
  },
  command: {},
}
