/**
 * Enterprise Domain — Phase 3 entity relationship types
 */

export type EnterpriseEntityType =
  | 'PRODUCT_CARD'
  | 'SALES_ORDER'
  | 'FABRIC_CARD'
  | 'ACCESSORY_CARD'
  | 'WAREHOUSE'
  | 'PRODUCTION_ORDER'
  | 'PURCHASE_REQUEST'
  | 'PURCHASE_ORDER'
  | 'QUALITY_PLAN'
  | 'COST_SHEET'
  | 'CUSTOMER'
  | 'BRAND'
  | 'BUYER'
  | 'MERCHANDISER'
  | 'BOM'
  | 'MRP_RUN'
  | 'OPERATION_ROUTE'
  | 'OPERATION'
  | 'SIZE_SET'
  | 'COLOR_CARD'
  | 'MEASUREMENT_TABLE'
  | 'TECHNICAL_SHEET'
  | 'SAMPLE'
  | 'SHIPMENT'
  | 'INVOICE'
  | 'SUPPLIER'
  | 'COMPOSITION'
  | 'STOCK_LOT'
  | 'INSPECTION'
  | 'WORKSHOP'
  | 'PRODUCTION_LINE'
  | 'MACHINE'
  | 'OPERATOR'
  | 'ZONE'
  | 'LOCATION'
  | 'DOCUMENT'
  | 'COMMENT'
  | 'WATCHER'

export type EnterpriseRelationKind =
  | 'HAS'
  | 'BELONGS_TO'
  | 'USES'
  | 'CONSUMES'
  | 'SUPPLIES'
  | 'PRODUCES'
  | 'INSPECTS'
  | 'APPROVES'
  | 'SNAPSHOT_OF'
  | 'DERIVED_FROM'
  | 'ROUTES_TO'
  | 'STORED_IN'
  | 'ASSIGNED_TO'
  | 'CONTAINS'
  | 'TRIGGERS'
  | 'FOLLOWS'
  | 'REFERENCES'
  | 'ATTACHED_TO'
  | 'WATCHED_BY'
  | 'COMMENTED_ON'

export type EntityRelation = {
  id: string
  fromType: EnterpriseEntityType
  fromId: string
  toType: EnterpriseEntityType
  toId: string
  kind: EnterpriseRelationKind
  label: string
  metadata?: Record<string, unknown>
}

export type EntityRelationBundle = {
  rootType: EnterpriseEntityType
  rootId: string
  rootCode: string
  rootLabel: string
  relations: EntityRelation[]
  maxDepth: number
}

export type EnterpriseRelationGraphNode = {
  id: string
  entityType: EnterpriseEntityType
  entityId: string
  label: string
  code?: string
  attributes?: Record<string, unknown>
}

export type EnterpriseRelationGraphEdge = {
  id: string
  fromNodeId: string
  toNodeId: string
  kind: EnterpriseRelationKind
  label: string
}

export type EnterpriseRelationGraph = {
  graphId: string
  assembledAt: string
  nodes: EnterpriseRelationGraphNode[]
  edges: EnterpriseRelationGraphEdge[]
  nodeCount: number
  edgeCount: number
  averageDepth: number
  bundles: EntityRelationBundle[]
  sideEffects: 'NONE'
}

// ─── Document Management ────────────────────────────────────────────

export type EnterpriseDocumentKind =
  | 'Attachment'
  | 'Photo'
  | 'PDF'
  | 'Excel'
  | 'TechPack'
  | 'MeasurementTable'
  | 'PatternFile'
  | 'LabReport'
  | 'Certificate'

export type EnterpriseDocument = {
  id: string
  entityType: EnterpriseEntityType
  entityId: string
  kind: EnterpriseDocumentKind
  fileName: string
  mimeType: string
  revisionNo: number
  uploadedBy: string
  uploadedAt: string
}

// ─── Collaboration ────────────────────────────────────────────────

export type EnterpriseComment = {
  id: string
  entityType: EnterpriseEntityType
  entityId: string
  threadId: string
  parentCommentId?: string
  author: string
  authorRole: string
  body: string
  mentions: string[]
  reactions: Array<{ emoji: string; userId: string }>
  createdAt: string
}

export type EnterpriseWatcher = {
  id: string
  entityType: EnterpriseEntityType
  entityId: string
  userId: string
  userName: string
  subscription: 'All' | 'Mentions' | 'StatusChanges'
  reminderAt?: string
  createdAt: string
}

// ─── Enterprise Timeline ──────────────────────────────────────────

export type EnterpriseTimelineEntry = {
  id: string
  entityType: EnterpriseEntityType
  entityId: string
  entityCode: string
  occurredAt: string
  actor: string
  action: string
  field?: string
  oldValue?: unknown
  newValue?: unknown
  reason?: string
  businessRuleId?: string
  approvalId?: string
  brainSuggestionId?: string
  metadata?: Record<string, unknown>
}

// ─── Domain-specific relation views ───────────────────────────────

export type ProductCardRelations = EntityRelationBundle & {
  bomId: string
  operationRouteIds: string[]
  sizeSetId: string
  defaultColorCardIds: string[]
  measurementChartId?: string
  technicalSheetRef?: string
  costSheetId?: string
  qualityPlanId?: string
  productionTemplateId?: string
}

export type SalesOrderRelationChain = EntityRelationBundle & {
  customerId: string
  productCardId: string
  productionOrderId?: string
  shipmentId?: string
  invoiceId?: string
}

export type FabricCardRelations = EntityRelationBundle & {
  supplierId: string
  compositionId: string
  stockLotIds: string[]
}

export type WarehouseRelations = EntityRelationBundle & {
  zoneIds: string[]
  locationIds: string[]
}

export type ProductionOrderRelations = EntityRelationBundle & {
  operationIds: string[]
  workshopId: string
  lineId?: string
}

export type QualityDomainRelations = EntityRelationBundle & {
  inspectionPlanId: string
  defectCodeIds: string[]
}

export type CostSheetRelations = EntityRelationBundle & {
  orderId: string
  scenarioHistoryIds: string[]
}
