/**
 * Persisted aggregate shapes — domain entity + persistence metadata.
 * Domain business types import edilir; SQL/ORM tipi yok.
 */
import type { BrainConfiguration } from '../../brain/types'
import type { DecisionMemoryEntry } from '../../brain/twin/types'
import type {
  Bundle,
  BundleTicket,
  ExecutionContext,
  ExecutionTimelineEvent,
  OperationDailyEntry,
  OperationExecution,
  OperationWorkSession,
  QualityGateEvaluation,
  SplitExecutionRecord,
  WipPosition,
  WipTransfer,
} from '../../execution-platform/execution-types'
import type { BaseMasterEntity, Customer, ProductionLine, Warehouse, Workshop } from '../../master-data/types'
import type {
  ApprovalWorkflow,
  AuditLogEntry,
  TimelineEntry,
  VersionedRecord,
} from '../../platform/types'
import type {
  DailyProductionEntryRecord,
  ProductionOrderLifecycleRecord,
  ProductionOrderSnapshot,
} from '../../production-order/lifecycle-types'
import type { ProductCard, SalesOrder, StockCard } from '../../types'
import type { PurchaseOrder } from '../../types/workflows'
import type { StockBalance, StockMovement } from '../../types/stock-ledger'
import type { AccessoryCard, FabricCard } from '../../types/textile-erp'
import type { AggregateRoot, StreamRecord } from './persistence.types'

/** Domain entity'ye persistence metadata ekler */
export type WithPersistenceMetadata<T extends { id: string }> = T &
  Pick<AggregateRoot, 'tenantId' | 'version' | 'schemaVersion' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
  }

export type PersistedSalesOrder = WithPersistenceMetadata<SalesOrder>

export type PersistedProductCard = WithPersistenceMetadata<ProductCard>

export type PersistedProductionOrder = WithPersistenceMetadata<ProductionOrderLifecycleRecord>

export type PersistedExecutionContext = WithPersistenceMetadata<ExecutionContext> & {
  operationExecutions: OperationExecution[]
}

export type PersistedBundle = WithPersistenceMetadata<Bundle> & {
  tickets: BundleTicket[]
}

export type PersistedSplitExecution = WithPersistenceMetadata<SplitExecutionRecord>

export type PersistedStockLedger = WithPersistenceMetadata<{ id: string; warehouseCode: string }> & {
  balances: StockBalance[]
  lastMovementNo: number
}

export type PersistedStockCard = WithPersistenceMetadata<StockCard>

export type PersistedApprovalWorkflow = WithPersistenceMetadata<ApprovalWorkflow>

export type PersistedEntityRevision = WithPersistenceMetadata<VersionedRecord>

export type PersistedPurchaseOrder = WithPersistenceMetadata<PurchaseOrder>

export type PersistedFabricCard = WithPersistenceMetadata<FabricCard>

export type PersistedAccessoryCard = WithPersistenceMetadata<AccessoryCard>

export type PersistedWarehouse = WithPersistenceMetadata<Warehouse>

export type PersistedWorkshop = WithPersistenceMetadata<Workshop>

export type PersistedProductionLine = WithPersistenceMetadata<ProductionLine>

export type PersistedCustomer = WithPersistenceMetadata<Customer>

export type PersistedBrainConfig = WithPersistenceMetadata<BrainConfiguration & { id: string }>

export type PersistedMasterEntity<T extends BaseMasterEntity> = WithPersistenceMetadata<T>

/** Stream records */
export type PersistedProductionDailyEntry = StreamRecord & DailyProductionEntryRecord

export type PersistedProductionOrderSnapshot = StreamRecord & {
  productionOrderNo: string
  revision: number
  capturedAt: string
  snapshot: ProductionOrderSnapshot
}

export type PersistedOperationDailyEntry = StreamRecord & OperationDailyEntry

export type PersistedOperationWorkSession = StreamRecord & OperationWorkSession

export type PersistedQualityGateEvaluation = StreamRecord & QualityGateEvaluation

export type PersistedWipTransfer = StreamRecord & WipTransfer

export type PersistedExecutionEvent = StreamRecord & ExecutionTimelineEvent

export type PersistedStockMovement = StreamRecord & StockMovement

export type PersistedAuditLogEntry = StreamRecord & AuditLogEntry

export type PersistedOrderTimelineEntry = StreamRecord & TimelineEntry

export type PersistedBrainDecisionMemory = StreamRecord & DecisionMemoryEntry

/** Read model */
export type WipPositionReadModelKey = string

export type WipPositionReadModel = {
  key: WipPositionReadModelKey
  tenantId: string
  productionOrderNo: string | null
  positions: WipPosition[]
  refreshedAt: string
}
