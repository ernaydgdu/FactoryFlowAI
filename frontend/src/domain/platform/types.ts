/** Platform katmanı — versioning, audit, approval, events, timeline, KPI, AI memory */

// --- 1) Versioning ---

export type RevisionStatus = 'Draft' | 'Active' | 'Obsolete'

export type RevisionMetadata = {
  revisionNo: number
  version: string
  status: RevisionStatus
  effectiveFrom: string
  effectiveTo?: string
  approvedBy?: string
  approvedDate?: string
  reasonOfChange?: string
  createdBy: string
  createdAt: string
}

export type VersionedEntityType =
  | 'ProductCard'
  | 'BOM'
  | 'OperationRoute'
  | 'CostSheet'
  | 'SalesOrder'
  | 'PurchaseOrder'
  | 'MrpRun'
  | 'SizeSet'
  | 'ColorCard'
  | 'ProductionRoute'

export type VersionedRecord<T = Record<string, unknown>> = {
  id: string
  entityType: VersionedEntityType
  entityKey: string
  revision: RevisionMetadata
  payload: T
}

// --- 2) Audit Trail ---

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'OBSOLETE' | 'SUBMIT'

export type AuditLogEntry = {
  id: string
  entityType: string
  entityId: string
  action: AuditAction
  changedBy: string
  changedAt: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  ip: string
  machine: string
  description: string
}

// --- 3) Approval Workflow ---

export type ApprovalStepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped'

export type ApprovalWorkflowType =
  | 'BOM'
  | 'ProductCard'
  | 'CostSheet'
  | 'ProductionRoute'
  | 'CostClosing'

export type ApprovalStep = {
  id: string
  role: string
  order: number
  status: ApprovalStepStatus
  actedBy?: string
  actedAt?: string
  comment?: string
}

export type ApprovalWorkflow = {
  id: string
  workflowType: ApprovalWorkflowType
  entityType: string
  entityId: string
  entityKey: string
  steps: ApprovalStep[]
  currentStepIndex: number
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedBy: string
  submittedAt: string
  completedAt?: string
}

// --- 4) Attachment Engine ---

export type AttachmentEntityType =
  | 'ProductCard'
  | 'SalesOrder'
  | 'PurchaseOrder'
  | 'ProductionOrder'
  | 'QualityInspection'

export type AttachmentFileType =
  | 'Teknik Föy'
  | 'Ölçü Tablosu'
  | 'Kalıp PDF'
  | 'Resim'
  | 'Müşteri PO'
  | 'Test Raporu'
  | 'Diğer'

export type Attachment = {
  id: string
  entityType: AttachmentEntityType
  entityId: string
  fileName: string
  fileType: AttachmentFileType
  mimeType: string
  sizeKb: number
  uploadedBy: string
  uploadedAt: string
  description?: string
}

// --- 5) Comment Engine ---

export type CommentEntityType = 'SalesOrder' | 'ProductionOrder' | 'PurchaseOrder' | 'PurchaseRequisition'

export type Comment = {
  id: string
  entityType: CommentEntityType
  entityId: string
  entityNo: string
  author: string
  authorRole: string
  body: string
  createdAt: string
  editedAt?: string
}

// --- 6) Tag Engine ---

export type SystemTag =
  | 'VIP'
  | 'Acil'
  | 'Numune'
  | 'Tekrar Sipariş'
  | 'İhracat'
  | 'İç Piyasa'
  | 'Riskli'

export type EntityTag = {
  id: string
  entityType: string
  entityId: string
  tag: SystemTag
  appliedBy: string
  appliedAt: string
}

// --- 7) Watcher ---

export type Watcher = {
  id: string
  entityType: string
  entityId: string
  entityNo: string
  userId: string
  userName: string
  createdAt: string
}

export type WatcherNotification = {
  id: string
  watcherId: string
  entityType: string
  entityId: string
  entityNo: string
  userId: string
  message: string
  createdAt: string
  read: boolean
}

// --- 8) Timeline ---

export type TimelineEventType =
  | 'OrderOpened'
  | 'BomCreated'
  | 'MrpGenerated'
  | 'PurchaseCreated'
  | 'StockReceived'
  | 'ProductionStarted'
  | 'QualityChecked'
  | 'PackagingDone'
  | 'ShipmentCompleted'
  | 'CommentAdded'
  | 'StatusChanged'
  | 'ApprovalCompleted'
  | 'ProductionSplit'

export type TimelineEntry = {
  id: string
  orderId: string
  orderNo: string
  eventType: TimelineEventType
  title: string
  description: string
  occurredAt: string
  actor: string
  metadata?: Record<string, unknown>
}

// --- 9) KPI Engine ---

export type KpiSnapshot = {
  generatedAt: string
  activeOrders: number
  terminRiskCount: number
  terminRiskPercent: number
  capacityUtilization: number
  workshopEfficiency: number
  stockTurnoverDays: number
  wasteRate: number
  productionEfficiency: number
  averageDelayDays: number
}

export type KpiDetail = {
  key: keyof Omit<KpiSnapshot, 'generatedAt'>
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'neutral'
  hint: string
}

// --- 10) Event Bus ---

export type DomainEventType =
  | 'OrderCreated'
  | 'BomApproved'
  | 'PurchaseCreated'
  | 'StockReceived'
  | 'ProductionStarted'
  | 'ProductionFinished'
  | 'ShipmentCompleted'
  | 'RevisionActivated'
  | 'ApprovalSubmitted'
  | 'ApprovalCompleted'
  | 'CommentAdded'
  | 'TagApplied'
  | 'EntityUpdated'

export type DomainEvent = {
  id: string
  type: DomainEventType
  aggregateType: string
  aggregateId: string
  aggregateNo?: string
  payload: Record<string, unknown>
  occurredAt: string
  causedBy: string
  correlationId?: string
}

export type EventHandler = (event: DomainEvent) => void

// --- 11) AI Memory ---

export type AiMemoryEntry = {
  id: string
  timestamp: string
  category: 'order' | 'production' | 'purchase' | 'quality' | 'shipment' | 'risk' | 'approval'
  entityType: string
  entityId: string
  entityNo: string
  summary: string
  detail: string
  eventType: DomainEventType
  importance: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
}

export type AiTimeline = {
  entityId: string
  entityNo: string
  entries: AiMemoryEntry[]
  generatedAt: string
}
