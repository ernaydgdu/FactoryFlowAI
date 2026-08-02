import type { IUnitOfWork, IUnitOfWorkFactory } from '@/domain/ports/persistence/unit-of-work.port'

import {
  AccessoryCardInMemoryRepository,
  BrainConfigInMemoryRepository,
  FabricCardInMemoryRepository,
  ProductCardInMemoryRepository,
  ProductionOrderSnapshotInMemoryStreamRepository,
  PurchaseOrderInMemoryRepository,
  SalesOrderInMemoryRepository,
  StockCardInMemoryRepository,
  StockLedgerInMemoryRepository,
  StockMovementInMemoryStreamRepository,
} from './aggregates/catalog-empty-adapters'
import { ApprovalWorkflowInMemoryRepository } from './aggregates/approval-workflow.in-memory.repository'
import { BundleInMemoryRepository } from './aggregates/bundle.in-memory.repository'
import { CodedAggregateFromLookupInMemoryRepository } from './aggregates/coded-aggregate-from-lookup.in-memory.repository'
import { EntityRevisionInMemoryRepository } from './aggregates/entity-revision.in-memory.repository'
import { ExecutionContextInMemoryRepository } from './aggregates/execution-context.in-memory.repository'
import { masterDataApprovalInMemory } from './aggregates/master-data-approval.in-memory.repository'
import { ProductionOrderInMemoryRepository } from './aggregates/production-order.in-memory.repository'
import { SplitExecutionInMemoryRepository } from './aggregates/split-execution.in-memory.repository'
import { aiMemoryCollectionInMemory } from './collections/ai-memory-collection.in-memory.repository'
import { attachmentCollectionInMemory } from './collections/attachment-collection.in-memory.repository'
import { commentCollectionInMemory } from './collections/comment-collection.in-memory.repository'
import { enterpriseTimelineCollectionInMemory } from './collections/enterprise-timeline-collection.in-memory.repository'
import { entityTagCollectionInMemory } from './collections/entity-tag-collection.in-memory.repository'
import { humanFeedbackCollectionInMemory } from './collections/human-feedback-collection.in-memory.repository'
import {
  watcherCollectionInMemory,
  watcherNotificationCollectionInMemory,
} from './collections/watcher-collection.in-memory.repository'
import { masterDataEnterpriseConfigInMemory } from './lookups/master-data-enterprise-config.in-memory'
import { masterDataLookupRegistryInMemory } from './lookups/master-data-lookup-registry.in-memory'
import { DomainEventOutboxInMemoryRepository } from './outbox/domain-event-outbox.in-memory.repository'
import { productionCalendarInMemory } from './read-models/production-calendar.in-memory.read-model'
import { WipPositionInMemoryReadModel } from './read-models/wip-position.in-memory.read-model'
import { inMemoryStoreRegistry } from './store-registry'
import { AuditLogInMemoryStreamRepository } from './streams/audit-log.in-memory.repository'
import { brainDecisionMemoryInMemory } from './streams/brain-decision-memory.in-memory.stream.repository'
import { ExecutionEventInMemoryStreamRepository } from './streams/execution-event.in-memory.stream.repository'
import { masterDataBrainChangeStreamInMemory } from './streams/master-data-brain-change-stream.in-memory.repository'
import { masterDataChangeStreamInMemory } from './streams/master-data-change-stream.in-memory.repository'
import { OperationDailyEntryInMemoryStreamRepository } from './streams/operation-daily-entry.in-memory.stream.repository'
import { OperationWorkSessionInMemoryStreamRepository } from './streams/operation-work-session.in-memory.stream.repository'
import { OrderTimelineInMemoryStreamRepository } from './streams/order-timeline.in-memory.repository'
import { ProductionDailyEntryInMemoryStreamRepository } from './streams/production-daily-entry.in-memory.stream.repository'
import { QualityGateEvaluationInMemoryStreamRepository } from './streams/quality-gate-evaluation.in-memory.stream.repository'
import { WipTransferInMemoryStreamRepository } from './streams/wip-transfer.in-memory.stream.repository'

export class InMemoryUnitOfWork implements IUnitOfWork {
  private readonly auditRepo = new AuditLogInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly timelineRepo = new OrderTimelineInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly approvalRepo = new ApprovalWorkflowInMemoryRepository(inMemoryStoreRegistry)
  private readonly revisionRepo = new EntityRevisionInMemoryRepository(inMemoryStoreRegistry)
  private readonly outboxRepo = new DomainEventOutboxInMemoryRepository(inMemoryStoreRegistry)
  private readonly productionOrderRepo = new ProductionOrderInMemoryRepository(inMemoryStoreRegistry)
  private readonly productionDailyRepo = new ProductionDailyEntryInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly executionContextRepo = new ExecutionContextInMemoryRepository(inMemoryStoreRegistry)
  private readonly bundleRepo = new BundleInMemoryRepository(inMemoryStoreRegistry)
  private readonly splitRepo = new SplitExecutionInMemoryRepository(inMemoryStoreRegistry)
  private readonly operationDailyRepo = new OperationDailyEntryInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly workSessionRepo = new OperationWorkSessionInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly qualityGateRepo = new QualityGateEvaluationInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly wipTransferRepo = new WipTransferInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly executionEventRepo = new ExecutionEventInMemoryStreamRepository(inMemoryStoreRegistry)
  private readonly wipPositionRepo = new WipPositionInMemoryReadModel(inMemoryStoreRegistry)
  private readonly mdApprovalRepo = masterDataApprovalInMemory
  private readonly mdChangeRepo = masterDataChangeStreamInMemory
  private readonly mdBrainChangeRepo = masterDataBrainChangeStreamInMemory
  private readonly mdLookups = masterDataLookupRegistryInMemory
  private readonly brainDecisionRepo = brainDecisionMemoryInMemory
  private readonly calendarRepo = productionCalendarInMemory

  begin(): void {
    // Snapshot managed by transaction-runtime; UoW marks TX boundary for adapter guards.
  }

  commit(): void {
    // Post-commit outbox worker flush handled by transaction-runtime.
  }

  rollback(): void {
    // Store restore handled by transaction-runtime snapshot rollback.
  }

  salesOrders = new SalesOrderInMemoryRepository() as unknown as IUnitOfWork['salesOrders']
  productCards = new ProductCardInMemoryRepository() as unknown as IUnitOfWork['productCards']
  productionOrders = this.productionOrderRepo
  executionContexts = this.executionContextRepo
  bundles = this.bundleRepo
  splitExecutions = this.splitRepo
  stockLedgers = new StockLedgerInMemoryRepository() as unknown as IUnitOfWork['stockLedgers']
  stockCards = new StockCardInMemoryRepository() as unknown as IUnitOfWork['stockCards']
  approvalWorkflows = this.approvalRepo
  entityRevisions = this.revisionRepo
  purchaseOrders = new PurchaseOrderInMemoryRepository() as unknown as IUnitOfWork['purchaseOrders']
  fabricCards = new FabricCardInMemoryRepository() as unknown as IUnitOfWork['fabricCards']
  accessoryCards = new AccessoryCardInMemoryRepository() as unknown as IUnitOfWork['accessoryCards']
  warehouses = new CodedAggregateFromLookupInMemoryRepository(this.mdLookups.warehouse) as IUnitOfWork['warehouses']
  workshops = new CodedAggregateFromLookupInMemoryRepository(this.mdLookups.workshop) as IUnitOfWork['workshops']
  productionLines = new CodedAggregateFromLookupInMemoryRepository(
    this.mdLookups.productionLine,
  ) as IUnitOfWork['productionLines']
  customers = new CodedAggregateFromLookupInMemoryRepository(this.mdLookups.customer) as IUnitOfWork['customers']
  brainConfigs = new BrainConfigInMemoryRepository() as unknown as IUnitOfWork['brainConfigs']

  masterDataLookups = this.mdLookups
  masterDataEnterpriseConfig = masterDataEnterpriseConfigInMemory
  masterDataChanges = this.mdChangeRepo
  masterDataApprovals = this.mdApprovalRepo
  masterDataBrainChanges = this.mdBrainChangeRepo

  productionDailyEntries = this.productionDailyRepo
  productionOrderSnapshots = new ProductionOrderSnapshotInMemoryStreamRepository() as unknown as IUnitOfWork['productionOrderSnapshots']
  operationDailyEntries = this.operationDailyRepo
  workSessions = this.workSessionRepo
  qualityGateEvaluations = this.qualityGateRepo
  wipTransfers = this.wipTransferRepo
  executionEvents = this.executionEventRepo
  stockMovements = new StockMovementInMemoryStreamRepository() as unknown as IUnitOfWork['stockMovements']
  auditLog = this.auditRepo
  orderTimeline = this.timelineRepo
  brainDecisionMemory = this.brainDecisionRepo
  outbox = this.outboxRepo
  wipPositions = this.wipPositionRepo
  productionCalendar = this.calendarRepo

  comments = commentCollectionInMemory
  entityTags = entityTagCollectionInMemory
  attachments = attachmentCollectionInMemory
  watchers = watcherCollectionInMemory
  watcherNotifications = watcherNotificationCollectionInMemory
  aiMemory = aiMemoryCollectionInMemory
  humanFeedback = humanFeedbackCollectionInMemory
  enterpriseTimeline = enterpriseTimelineCollectionInMemory
}

export class InMemoryUnitOfWorkFactory implements IUnitOfWorkFactory {
  create(): IUnitOfWork {
    return new InMemoryUnitOfWork()
  }
}

export function getInMemoryPlatformRepositories() {
  const uow = new InMemoryUnitOfWork()
  return {
    auditLog: uow.auditLog as AuditLogInMemoryStreamRepository,
    orderTimeline: uow.orderTimeline as OrderTimelineInMemoryStreamRepository,
    approvalWorkflows: uow.approvalWorkflows as ApprovalWorkflowInMemoryRepository,
    entityRevisions: uow.entityRevisions as EntityRevisionInMemoryRepository,
    outbox: uow.outbox as DomainEventOutboxInMemoryRepository,
  }
}

export { inMemoryStoreRegistry }
