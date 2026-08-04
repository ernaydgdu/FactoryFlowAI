import {
  executeCloseFinancialPeriod,
  executeEnqueueOperationalEvents,
  executePostBatch,
  executeReverseBatch,
  executeUpsertGlMapping,
  queryBatch,
  queryBatches,
  queryBrain,
  queryDashboard,
  queryFailed,
  queryMappings,
  queryPeriods,
  queryQueue,
  queryResults,
} from './finance-integration-command.mapper'

export const financeIntegrationApplicationService = {
  query: {
    dashboard: queryDashboard,
    batches: queryBatches,
    detail: queryBatch,
    queue: queryQueue,
    failed: queryFailed,
    results: queryResults,
    mappings: queryMappings,
    periods: queryPeriods,
    brain: queryBrain,
  },
  command: {
    enqueue: executeEnqueueOperationalEvents,
    post: executePostBatch,
    reverse: executeReverseBatch,
    upsertGlMapping: executeUpsertGlMapping,
    closePeriod: executeCloseFinancialPeriod,
  },
}
