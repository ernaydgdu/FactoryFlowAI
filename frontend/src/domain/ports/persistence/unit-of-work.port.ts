/**
 * Unit of Work port — transaction boundary container.
 * @see docs/architecture/PERSISTENCE-CONSTITUTION.md §4.3
 */
import type { IAccessoryCardRepository } from './aggregates/accessory-card.repository'
import type { IApprovalWorkflowRepository } from './aggregates/approval-workflow.repository'
import type { IMasterDataApprovalRepository } from './aggregates/master-data-approval.repository'
import type { IBrainConfigRepository } from './aggregates/brain-config.repository'
import type { IBundleRepository } from './aggregates/bundle.repository'
import type { ICustomerRepository } from './aggregates/customer.repository'
import type { IEntityRevisionRepository } from './aggregates/entity-revision.repository'
import type { IExecutionContextRepository } from './aggregates/execution-context.repository'
import type { IFabricCardRepository } from './aggregates/fabric-card.repository'
import type { IProductCardRepository } from './aggregates/product-card.repository'
import type { IProductionLineRepository } from './aggregates/production-line.repository'
import type { IProductionOrderRepository } from './aggregates/production-order.repository'
import type { IMrpRunRepository } from './aggregates/mrp-run.repository'
import type { IPurchaseOrderRepository } from './aggregates/purchase-order.repository'
import type { IPurchaseRequestRepository } from './aggregates/purchase-request.repository'
import type { IGoodsReceiptRepository } from './aggregates/goods-receipt.repository'
import type { IPackingListRepository } from './aggregates/packing-list.repository'
import type { IShipmentRepository } from './aggregates/shipment.repository'
import type { IExportDocumentSetRepository } from './aggregates/export-document-set.repository'
import type { IExportShipmentRepository } from './aggregates/export-shipment.repository'
import type { IAccountingIntegrationRepository } from './aggregates/accounting-integration.repository'
import type { IRequestForQuotationRepository } from './aggregates/rfq.repository'
import type { ISupplierQuotationRepository } from './aggregates/supplier-quotation.repository'
import type { ISalesOrderRepository } from './aggregates/sales-order.repository'
import type { ISplitExecutionRepository } from './aggregates/split-execution.repository'
import type { IStockCardRepository } from './aggregates/stock-card.repository'
import type { IStockLedgerRepository } from './aggregates/stock-ledger.repository'
import type { IUserAccountRepository } from './aggregates/user-account.repository'
import type { IWarehouseRepository } from './aggregates/warehouse.repository'
import type { IWorkshopRepository } from './aggregates/workshop.repository'
import type { IDomainEventOutboxRepository } from './outbox/domain-event-outbox.repository'
import type { IWipPositionReadModel } from './read-models/wip-position.read-model'
import type { IMasterDataEnterpriseConfigPort } from './lookups/master-data-enterprise-config.port'
import type { IMasterDataLookupRegistryPort } from './lookups/master-data-lookup-registry.port'
import type { IAuditLogStreamRepository } from './streams/audit-log-stream.repository'
import type { IBrainDecisionMemoryStreamRepository } from './streams/brain-decision-memory-stream.repository'
import type { IAiMemoryCollectionRepository } from './collections/ai-memory-collection.repository'
import type { IAttachmentCollectionRepository } from './collections/attachment-collection.repository'
import type { ICommentCollectionRepository } from './collections/comment-collection.repository'
import type { IEnterpriseTimelineCollectionRepository } from './collections/enterprise-timeline-collection.repository'
import type { IEntityTagCollectionRepository } from './collections/entity-tag-collection.repository'
import type { IHumanFeedbackCollectionRepository } from './collections/human-feedback-collection.repository'
import type {
  IWatcherCollectionRepository,
  IWatcherNotificationCollectionRepository,
} from './collections/watcher-collection.repository'
import type { IProductionCalendarReadModel } from './read-models/production-calendar.read-model'
import type { IExecutionEventStreamRepository } from './streams/execution-event-stream.repository'
import type { IOperationDailyEntryStreamRepository } from './streams/operation-daily-entry-stream.repository'
import type { IOperationWorkSessionStreamRepository } from './streams/operation-work-session-stream.repository'
import type { IOrderTimelineStreamRepository } from './streams/order-timeline-stream.repository'
import type { IProductionDailyEntryStreamRepository } from './streams/production-daily-entry-stream.repository'
import type { IProductionOrderSnapshotStreamRepository } from './streams/production-order-snapshot-stream.repository'
import type { IQualityGateEvaluationStreamRepository } from './streams/quality-gate-evaluation-stream.repository'
import type { IStockMovementStreamRepository } from './streams/stock-movement-stream.repository'
import type { IMasterDataBrainChangeStreamRepository } from './streams/master-data-brain-change-stream.repository'
import type { IMasterDataChangeStreamRepository } from './streams/master-data-change-stream.repository'
import type { IWipTransferStreamRepository } from './streams/wip-transfer-stream.repository'

export interface IUnitOfWork {
  begin(): void
  commit(): void
  rollback(): void

  /** Aggregate repositories */
  salesOrders: ISalesOrderRepository
  productCards: IProductCardRepository
  productionOrders: IProductionOrderRepository
  executionContexts: IExecutionContextRepository
  bundles: IBundleRepository
  splitExecutions: ISplitExecutionRepository
  stockLedgers: IStockLedgerRepository
  stockCards: IStockCardRepository
  approvalWorkflows: IApprovalWorkflowRepository
  entityRevisions: IEntityRevisionRepository
  purchaseOrders: IPurchaseOrderRepository
  purchaseRequests: IPurchaseRequestRepository
  rfqs: IRequestForQuotationRepository
  supplierQuotations: ISupplierQuotationRepository
  goodsReceipts: IGoodsReceiptRepository
  packingLists: IPackingListRepository
  shipments: IShipmentRepository
  exportDocumentSets: IExportDocumentSetRepository
  exportShipments: IExportShipmentRepository
  accountingIntegrations: IAccountingIntegrationRepository
  mrpRuns: IMrpRunRepository
  fabricCards: IFabricCardRepository
  accessoryCards: IAccessoryCardRepository
  warehouses: IWarehouseRepository
  workshops: IWorkshopRepository
  productionLines: IProductionLineRepository
  customers: ICustomerRepository
  userAccounts: IUserAccountRepository
  brainConfigs: IBrainConfigRepository

  /** Master Data — lookup registry + enterprise config */
  masterDataLookups: IMasterDataLookupRegistryPort
  masterDataEnterpriseConfig: IMasterDataEnterpriseConfigPort
  masterDataChanges: IMasterDataChangeStreamRepository
  masterDataApprovals: IMasterDataApprovalRepository
  masterDataBrainChanges: IMasterDataBrainChangeStreamRepository

  /** Stream repositories (TX-scoped append) */
  productionDailyEntries: IProductionDailyEntryStreamRepository
  productionOrderSnapshots: IProductionOrderSnapshotStreamRepository
  operationDailyEntries: IOperationDailyEntryStreamRepository
  workSessions: IOperationWorkSessionStreamRepository
  qualityGateEvaluations: IQualityGateEvaluationStreamRepository
  wipTransfers: IWipTransferStreamRepository
  executionEvents: IExecutionEventStreamRepository
  stockMovements: IStockMovementStreamRepository
  auditLog: IAuditLogStreamRepository
  orderTimeline: IOrderTimelineStreamRepository
  brainDecisionMemory: IBrainDecisionMemoryStreamRepository

  /** Outbox */
  outbox: IDomainEventOutboxRepository

  /** Read models */
  wipPositions: IWipPositionReadModel
  productionCalendar: IProductionCalendarReadModel

  /** Platform collaboration collections */
  comments: ICommentCollectionRepository
  entityTags: IEntityTagCollectionRepository
  attachments: IAttachmentCollectionRepository
  watchers: IWatcherCollectionRepository
  watcherNotifications: IWatcherNotificationCollectionRepository
  aiMemory: IAiMemoryCollectionRepository
  humanFeedback: IHumanFeedbackCollectionRepository
  enterpriseTimeline: IEnterpriseTimelineCollectionRepository
}

export interface IUnitOfWorkFactory {
  create(): IUnitOfWork
}
