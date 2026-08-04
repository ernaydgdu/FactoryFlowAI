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
import type { MrpRun } from '../../mrp/mrp.types'
import type { ProductCard, SalesOrder, StockCard } from '../../types'
import type {
  GoodsReceipt,
  PurchaseOrderAggregate,
  PurchaseRequest,
  RequestForQuotation,
  SupplierQuotation,
} from '../../purchasing/purchasing.types'
import type { PackingList } from '../../packaging/packaging.types'
import type { ShipmentRecord } from '../../shipment/shipment.types'
import type { ExportDocumentSet } from '../../commercial-documents/commercial-documents.types'
import type { ExportShipment } from '../../export-logistics/export-logistics.types'
import type { PurchaseOrder } from '../../types/workflows'
import type { StockBalance, StockMovement } from '../../types/stock-ledger'
import type { AccessoryCard, FabricCard, TextileProductCard } from '../../types/textile-erp'
import type { UserAccountStatus, KeplerRole } from '../../platform/iam/types'
import type { AggregateRoot, StreamRecord } from './persistence.types'

/** Domain entity'ye persistence metadata ekler */
export type WithPersistenceMetadata<T extends { id: string }> = T &
  Pick<AggregateRoot, 'tenantId' | 'version' | 'schemaVersion' | 'deletedAt'> & {
    createdAt: string
    updatedAt: string
  }

export type PersistedSalesOrder = WithPersistenceMetadata<SalesOrder>

/** @deprecated Legacy flat shape — runtime aggregate is TextileProductCard */
export type PersistedLegacyProductCard = WithPersistenceMetadata<ProductCard>

export type PersistedProductCard = WithPersistenceMetadata<TextileProductCard>

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

/** Phase 3 Module 3 — lifecycle PO aggregate */
export type PersistedPurchaseOrderAggregate = WithPersistenceMetadata<PurchaseOrderAggregate>

export type PersistedPurchaseRequest = WithPersistenceMetadata<PurchaseRequest>

export type PersistedRequestForQuotation = WithPersistenceMetadata<RequestForQuotation>

export type PersistedSupplierQuotation = WithPersistenceMetadata<SupplierQuotation>

export type PersistedGoodsReceipt = WithPersistenceMetadata<GoodsReceipt>

export type PersistedPackingList = WithPersistenceMetadata<PackingList>

export type PersistedShipmentRecord = WithPersistenceMetadata<ShipmentRecord>

export type PersistedExportDocumentSet = WithPersistenceMetadata<ExportDocumentSet>

export type PersistedExportShipment = WithPersistenceMetadata<ExportShipment>

export type PersistedMrpRun = WithPersistenceMetadata<MrpRun>

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

/** Platform IAM — user account aggregate (credentials stored separately from DTO) */
export type PersistedUserAccount = WithPersistenceMetadata<{
  id: string
  email: string
  fullName: string
  role: KeplerRole
  factoryId: string
  status: UserAccountStatus
  passwordHash: string
  passwordSalt: string
}>

/** Read model */
export type WipPositionReadModelKey = string

export type WipPositionReadModel = {
  key: WipPositionReadModelKey
  tenantId: string
  productionOrderNo: string | null
  positions: WipPosition[]
  refreshedAt: string
}
