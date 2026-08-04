import { runFinanceWriteCommand } from './finance-integration-permission.guard'
import {
  FinanceIntegrationDomainError,
  persistCloseFinancialPeriod,
  persistEnqueueOperationalEvents,
  persistPostBatch,
  persistReverseBatch,
  persistUpsertGlMapping,
} from '@/domain/finance-integration/finance-integration-crud.service'
import {
  queryAccountingIntegrationById,
  queryAllAccountingIntegrations,
  queryFailedPostings,
  queryFinanceIntegrationBrainReadModel,
  queryFinanceIntegrationDashboard,
  queryFinancialPeriods,
  queryGlMappings,
  queryPostedResults,
  queryPostingQueue,
} from '@/domain/finance-integration/finance-integration-query.service'

import type {
  CloseFinancialPeriodCommand,
  EnqueueOperationalEventsCommand,
  PostBatchCommand,
  ReverseBatchCommand,
  UpsertGlMappingCommand,
} from './finance-integration.dto'

export { FinanceIntegrationDomainError }

export function executeEnqueueOperationalEvents(command: EnqueueOperationalEventsCommand) {
  return runFinanceWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistEnqueueOperationalEvents(input, actorUserId)
  })
}

export function executePostBatch(command: PostBatchCommand) {
  return runFinanceWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistPostBatch(input, actorUserId)
  })
}

export function executeReverseBatch(command: ReverseBatchCommand) {
  return runFinanceWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistReverseBatch(input, actorUserId)
  })
}

export function executeUpsertGlMapping(command: UpsertGlMappingCommand) {
  return runFinanceWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistUpsertGlMapping(input, actorUserId)
  })
}

export function executeCloseFinancialPeriod(command: CloseFinancialPeriodCommand) {
  return runFinanceWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCloseFinancialPeriod(input, actorUserId)
  })
}

export function queryBatches() {
  return queryAllAccountingIntegrations()
}

export function queryBatch(id: string) {
  return queryAccountingIntegrationById(id)
}

export function queryQueue() {
  return queryPostingQueue()
}

export function queryFailed() {
  return queryFailedPostings()
}

export function queryResults() {
  return queryPostedResults()
}

export function queryMappings() {
  return queryGlMappings()
}

export function queryPeriods() {
  return queryFinancialPeriods()
}

export function queryDashboard() {
  const d = queryFinanceIntegrationDashboard()
  return {
    kpis: [
      { label: 'Batches', value: String(d.total) },
      { label: 'Queued', value: String(d.queued) },
      { label: 'Posted', value: String(d.posted) },
      { label: 'Failed', value: String(d.failed) },
      { label: 'Reversed', value: String(d.reversed) },
      { label: 'Open Periods', value: String(d.openPeriods) },
    ],
  }
}

export function queryBrain() {
  return queryFinanceIntegrationBrainReadModel()
}
