/**
 * Enterprise Master Data — Phase 2 domain kontratları
 */
import type { BaseMasterEntity, MasterDataEntityType } from '../types'

// ─── Hierarchy ────────────────────────────────────────────────────

export type HierarchyEntityType =
  | 'productGroup'
  | 'warehouse'
  | 'operation'
  | 'machineGroup'
  | 'accessoryCategory'
  | 'fabricCategory'
  | 'customerGroup'
  | 'supplierGroup'
  | 'country'
  | 'department'

export type HierarchicalMasterEntity = {
  parentId?: string
}

// ─── Generic Attributes ───────────────────────────────────────────

export type AttributeDataType = 'string' | 'number' | 'boolean' | 'date' | 'reference' | 'enum'

export type MasterDataAttributeDefinition = {
  id: string
  code: string
  name: string
  entityType: MasterDataEntityType | 'fabricCategory' | 'company'
  dataType: AttributeDataType
  unit?: string
  sortOrder: number
  isRequired: boolean
  referenceEntityType?: MasterDataEntityType
}

export type MasterDataAttributeValue = {
  attributeDefinitionId: string
  attributeCode: string
  entityType: string
  entityId: string
  value: string | number | boolean
}

// ─── Validation Rules ─────────────────────────────────────────────

export type ValidationRuleKind =
  | 'required'
  | 'min'
  | 'max'
  | 'default'
  | 'precision'
  | 'regex'
  | 'unique'

export type MasterDataValidationRule = {
  id: string
  entityType: MasterDataEntityType | 'fabricCategory' | 'company'
  fieldCode: string
  rule: ValidationRuleKind
  value?: string | number | boolean
  message: string
}

export type FieldValidationContext = {
  entityType: string
  fieldCode: string
  value: unknown
  entityId?: string
}

// ─── Dependencies ─────────────────────────────────────────────────

export type MasterDataDependencyKind =
  | 'requires'
  | 'suggests'
  | 'defaultsTo'
  | 'routesTo'

export type MasterDataDependency = {
  id: string
  kind: MasterDataDependencyKind
  sourceEntityType: MasterDataEntityType
  sourceEntityId: string
  targetEntityType: MasterDataEntityType
  targetEntityId: string
  priority: number
}

// ─── Defaults ─────────────────────────────────────────────────────

export type MasterDataDefaultProfile = {
  id: string
  code: string
  name: string
  productGroupId: string
  sizeSetId: string
  washTypeId: string
  printTypeId: string
  embroideryTypeId: string
  operationRouteIds: string[]
  bomTemplateId?: string
}

// ─── Templates ────────────────────────────────────────────────────

export type ProductTemplateStatus = 'Draft' | 'Active' | 'Obsolete'

export type ProductTemplate = {
  id: string
  code: string
  name: string
  description: string
  productGroupId: string
  sizeSetId: string
  defaultProfileId: string
  status: ProductTemplateStatus
  version: number
}

// ─── Import / Export ──────────────────────────────────────────────

export type MasterDataImportFormat = 'csv' | 'excel' | 'json'

export type MasterDataExportFormat = 'csv' | 'excel' | 'json'

export type MasterDataImportContract = {
  format: MasterDataImportFormat
  entityType: MasterDataEntityType
  columns: string[]
  validateBeforeImport: boolean
  dryRun: boolean
}

export type MasterDataExportContract = {
  format: MasterDataExportFormat
  entityType: MasterDataEntityType
  columns: string[]
  includeInactive: boolean
}

export type MasterDataImportResult = {
  entityType: MasterDataEntityType
  format: MasterDataImportFormat
  totalRows: number
  imported: number
  skipped: number
  errors: string[]
}

export type MasterDataExportResult = {
  entityType: MasterDataEntityType
  format: MasterDataExportFormat
  rowCount: number
  payload: string
  generatedAt: string
}

// ─── Audit & Approval ─────────────────────────────────────────────

export type MasterDataLifecycleStatus = 'Draft' | 'PendingApproval' | 'Active' | 'Inactive' | 'Deleted'

export type MasterDataChangeRecord = {
  id: string
  entityType: MasterDataEntityType
  entityId: string
  entityCode: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'SUBMIT'
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  version: number
  changedBy: string
  changedAt: string
}

export type MasterDataApprovalRequest = {
  id: string
  entityType: MasterDataEntityType
  entityId: string
  entityCode: string
  lifecycleStatus: MasterDataLifecycleStatus
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
}

export type MasterDataBrainChangeEvent = {
  entityType: MasterDataEntityType
  entityId: string
  entityCode: string
  changeType: 'created' | 'updated' | 'approved' | 'activated'
  summary: string
  occurredAt: string
}

export type EnterpriseMasterEntity = BaseMasterEntity & {
  lifecycleStatus?: MasterDataLifecycleStatus
}
