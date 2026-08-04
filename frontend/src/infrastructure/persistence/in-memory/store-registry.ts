/**
 * InMemory persistence — paylaşımlı store registry.
 */
import type {
  PersistedApprovalWorkflow,
  PersistedAuditLogEntry,
  PersistedBundle,
  PersistedEntityRevision,
  PersistedExecutionContext,
  PersistedExecutionEvent,
  PersistedMrpRun,
  PersistedOperationDailyEntry,
  PersistedOperationWorkSession,
  PersistedOrderTimelineEntry,
  PersistedProductionDailyEntry,
  PersistedProductionOrder,
  PersistedProductCard,
  PersistedPurchaseOrderAggregate,
  PersistedPurchaseRequest,
  PersistedRequestForQuotation,
  PersistedSupplierQuotation,
  PersistedGoodsReceipt,
  PersistedPackingList,
  PersistedQualityGateEvaluation,
  PersistedSalesOrder,
  PersistedSplitExecution,
  PersistedStockCard,
  PersistedStockLedger,
  PersistedStockMovement,
  PersistedWipTransfer,
  WipPositionReadModel,
} from '@/domain/ports/persistence/persistence-aggregates'
import type { OutboxMessage } from '@/domain/ports/persistence/persistence.types'
import type { ApprovalWorkflow, AuditLogEntry, DomainEvent, TimelineEntry, VersionedRecord } from '@/domain/platform/types'

export class InMemoryStoreRegistry {
  auditLogs: PersistedAuditLogEntry[] = []
  auditCounter = 0

  timelineEntries: PersistedOrderTimelineEntry[] = []
  timelineCounter = 0

  approvalWorkflows: PersistedApprovalWorkflow[] = []

  entityRevisions: PersistedEntityRevision[] = []

  outboxMessages: OutboxMessage[] = []
  outboxCounter = 0

  domainEvents: DomainEvent[] = []
  eventCounter = 0

  productionOrders: PersistedProductionOrder[] = []
  productionOrderCounter = 0

  productCards: PersistedProductCard[] = []
  productCardCounter = 0

  salesOrders: PersistedSalesOrder[] = []
  salesOrderCounter = 0

  mrpRuns: PersistedMrpRun[] = []
  mrpRunCounter = 0

  purchaseOrders: PersistedPurchaseOrderAggregate[] = []
  purchaseOrderCounter = 0

  purchaseRequests: PersistedPurchaseRequest[] = []
  purchaseRequestCounter = 0

  rfqs: PersistedRequestForQuotation[] = []
  rfqCounter = 0

  supplierQuotations: PersistedSupplierQuotation[] = []
  supplierQuotationCounter = 0

  goodsReceipts: PersistedGoodsReceipt[] = []
  goodsReceiptCounter = 0

  packingLists: PersistedPackingList[] = []
  packingListCounter = 0
  ssccSerialCounter = 0

  stockCards: PersistedStockCard[] = []

  stockLedgers: PersistedStockLedger[] = []
  stockLedgerCounter = 0

  stockMovements: PersistedStockMovement[] = []
  stockMovementCounter = 0

  productionDailyEntries: PersistedProductionDailyEntry[] = []
  productionDailyEntryCounter = 0

  executionContexts: PersistedExecutionContext[] = []
  executionContextCounter = 0
  operationCounter = 0

  bundles: PersistedBundle[] = []
  bundleCounter = 0
  ticketCounter = 0
  wipTransferCounter = 0

  splitExecutions: PersistedSplitExecution[] = []
  splitCounter = 0

  operationDailyEntries: PersistedOperationDailyEntry[] = []
  operationDailyEntryCounter = 0

  workSessions: PersistedOperationWorkSession[] = []
  workSessionCounter = 0

  qualityGateEvaluations: PersistedQualityGateEvaluation[] = []
  qualityGateCounter = 0

  wipTransfers: PersistedWipTransfer[] = []

  executionEvents: PersistedExecutionEvent[] = []
  executionEventCounter = 0

  wipPositionModels: WipPositionReadModel[] = []

  seedAuditLogs(entries: AuditLogEntry[]): void {
    this.auditLogs = entries.map((e, i) => this.toPersistedAudit(e, i + 1))
    this.auditCounter = entries.length
  }

  seedTimeline(entries: TimelineEntry[]): void {
    this.timelineEntries = entries.map((e, i) => this.toPersistedTimeline(e, i + 1))
    this.timelineCounter = entries.length
  }

  seedApprovalWorkflows(workflows: ApprovalWorkflow[]): void {
    this.approvalWorkflows = workflows.map((w) => this.toPersistedApproval(w))
  }

  seedRevisions(records: VersionedRecord[]): void {
    this.entityRevisions = records.map((r) => this.toPersistedRevision(r))
  }

  seedEvents(events: DomainEvent[]): void {
    this.domainEvents = [...events]
    this.eventCounter = events.length
  }

  toPersistedAudit(entry: AuditLogEntry, sequence: number): PersistedAuditLogEntry {
    return {
      ...entry,
      tenantId: 'kepler-default',
      streamType: 'audit',
      streamId: `${entry.entityType}:${entry.entityId}`,
      sequence,
    }
  }

  toPersistedTimeline(entry: TimelineEntry, sequence: number): PersistedOrderTimelineEntry {
    return {
      ...entry,
      tenantId: 'kepler-default',
      streamType: 'order_timeline',
      streamId: entry.orderId,
      sequence,
    }
  }

  toPersistedApproval(workflow: ApprovalWorkflow): PersistedApprovalWorkflow {
    const now = workflow.submittedAt ?? new Date().toISOString()
    return {
      ...workflow,
      tenantId: 'kepler-default',
      version: 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
  }

  toPersistedRevision(record: VersionedRecord): PersistedEntityRevision {
    const now = record.revision.createdAt ?? new Date().toISOString()
    return {
      ...record,
      tenantId: 'kepler-default',
      version: record.revision.revisionNo,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
  }
}

export const inMemoryStoreRegistry = new InMemoryStoreRegistry()
