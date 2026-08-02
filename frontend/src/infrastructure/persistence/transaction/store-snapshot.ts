import type { InMemoryStoreRegistry } from '../in-memory/store-registry'

/** Serializable snapshot of shared InMemory store state for TX rollback. */
export type StoreSnapshot = {
  auditLogs: InMemoryStoreRegistry['auditLogs']
  auditCounter: number
  timelineEntries: InMemoryStoreRegistry['timelineEntries']
  timelineCounter: number
  approvalWorkflows: InMemoryStoreRegistry['approvalWorkflows']
  entityRevisions: InMemoryStoreRegistry['entityRevisions']
  outboxMessages: InMemoryStoreRegistry['outboxMessages']
  outboxCounter: number
  domainEvents: InMemoryStoreRegistry['domainEvents']
  eventCounter: number
  productionOrders: InMemoryStoreRegistry['productionOrders']
  productionOrderCounter: number
  productionDailyEntries: InMemoryStoreRegistry['productionDailyEntries']
  productionDailyEntryCounter: number
  executionContexts: InMemoryStoreRegistry['executionContexts']
  executionContextCounter: number
  operationCounter: number
  bundles: InMemoryStoreRegistry['bundles']
  bundleCounter: number
  ticketCounter: number
  wipTransferCounter: number
  splitExecutions: InMemoryStoreRegistry['splitExecutions']
  splitCounter: number
  operationDailyEntries: InMemoryStoreRegistry['operationDailyEntries']
  operationDailyEntryCounter: number
  workSessions: InMemoryStoreRegistry['workSessions']
  workSessionCounter: number
  qualityGateEvaluations: InMemoryStoreRegistry['qualityGateEvaluations']
  qualityGateCounter: number
  wipTransfers: InMemoryStoreRegistry['wipTransfers']
  executionEvents: InMemoryStoreRegistry['executionEvents']
  executionEventCounter: number
  wipPositionModels: InMemoryStoreRegistry['wipPositionModels']
}

export function createStoreSnapshot(stores: InMemoryStoreRegistry): StoreSnapshot {
  return structuredClone({
    auditLogs: stores.auditLogs,
    auditCounter: stores.auditCounter,
    timelineEntries: stores.timelineEntries,
    timelineCounter: stores.timelineCounter,
    approvalWorkflows: stores.approvalWorkflows,
    entityRevisions: stores.entityRevisions,
    outboxMessages: stores.outboxMessages,
    outboxCounter: stores.outboxCounter,
    domainEvents: stores.domainEvents,
    eventCounter: stores.eventCounter,
    productionOrders: stores.productionOrders,
    productionOrderCounter: stores.productionOrderCounter,
    productionDailyEntries: stores.productionDailyEntries,
    productionDailyEntryCounter: stores.productionDailyEntryCounter,
    executionContexts: stores.executionContexts,
    executionContextCounter: stores.executionContextCounter,
    operationCounter: stores.operationCounter,
    bundles: stores.bundles,
    bundleCounter: stores.bundleCounter,
    ticketCounter: stores.ticketCounter,
    wipTransferCounter: stores.wipTransferCounter,
    splitExecutions: stores.splitExecutions,
    splitCounter: stores.splitCounter,
    operationDailyEntries: stores.operationDailyEntries,
    operationDailyEntryCounter: stores.operationDailyEntryCounter,
    workSessions: stores.workSessions,
    workSessionCounter: stores.workSessionCounter,
    qualityGateEvaluations: stores.qualityGateEvaluations,
    qualityGateCounter: stores.qualityGateCounter,
    wipTransfers: stores.wipTransfers,
    executionEvents: stores.executionEvents,
    executionEventCounter: stores.executionEventCounter,
    wipPositionModels: stores.wipPositionModels,
  })
}

export function restoreStoreSnapshot(stores: InMemoryStoreRegistry, snapshot: StoreSnapshot): void {
  stores.auditLogs = snapshot.auditLogs
  stores.auditCounter = snapshot.auditCounter
  stores.timelineEntries = snapshot.timelineEntries
  stores.timelineCounter = snapshot.timelineCounter
  stores.approvalWorkflows = snapshot.approvalWorkflows
  stores.entityRevisions = snapshot.entityRevisions
  stores.outboxMessages = snapshot.outboxMessages
  stores.outboxCounter = snapshot.outboxCounter
  stores.domainEvents = snapshot.domainEvents
  stores.eventCounter = snapshot.eventCounter
  stores.productionOrders = snapshot.productionOrders
  stores.productionOrderCounter = snapshot.productionOrderCounter
  stores.productionDailyEntries = snapshot.productionDailyEntries
  stores.productionDailyEntryCounter = snapshot.productionDailyEntryCounter
  stores.executionContexts = snapshot.executionContexts
  stores.executionContextCounter = snapshot.executionContextCounter
  stores.operationCounter = snapshot.operationCounter
  stores.bundles = snapshot.bundles
  stores.bundleCounter = snapshot.bundleCounter
  stores.ticketCounter = snapshot.ticketCounter
  stores.wipTransferCounter = snapshot.wipTransferCounter
  stores.splitExecutions = snapshot.splitExecutions
  stores.splitCounter = snapshot.splitCounter
  stores.operationDailyEntries = snapshot.operationDailyEntries
  stores.operationDailyEntryCounter = snapshot.operationDailyEntryCounter
  stores.workSessions = snapshot.workSessions
  stores.workSessionCounter = snapshot.workSessionCounter
  stores.qualityGateEvaluations = snapshot.qualityGateEvaluations
  stores.qualityGateCounter = snapshot.qualityGateCounter
  stores.wipTransfers = snapshot.wipTransfers
  stores.executionEvents = snapshot.executionEvents
  stores.executionEventCounter = snapshot.executionEventCounter
  stores.wipPositionModels = snapshot.wipPositionModels
}
