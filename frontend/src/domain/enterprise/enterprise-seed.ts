/**
 * Enterprise relation seed — demo documents, quality, collaboration
 */
import type {
  EnterpriseComment,
  EnterpriseDocument,
  EnterpriseTimelineEntry,
  EnterpriseWatcher,
} from './types'

export const ENTERPRISE_DOCUMENTS: EnterpriseDocument[] = [
  { id: 'doc-1', entityType: 'PRODUCT_CARD', entityId: '1', kind: 'TechPack', fileName: 'TF-1-R1.pdf', mimeType: 'application/pdf', revisionNo: 1, uploadedBy: 'planner@kepler.local', uploadedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'doc-2', entityType: 'PRODUCT_CARD', entityId: '1', kind: 'MeasurementTable', fileName: 'mc-1.xlsx', mimeType: 'application/vnd.ms-excel', revisionNo: 1, uploadedBy: 'planner@kepler.local', uploadedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'doc-3', entityType: 'FABRIC_CARD', entityId: 'sc-1', kind: 'Certificate', fileName: 'oeko-tex-sc1.pdf', mimeType: 'application/pdf', revisionNo: 1, uploadedBy: 'qc@kepler.local', uploadedAt: '2026-01-15T00:00:00.000Z' },
  { id: 'doc-4', entityType: 'SALES_ORDER', entityId: '1', kind: 'PDF', fileName: 'customer-po-1001.pdf', mimeType: 'application/pdf', revisionNo: 1, uploadedBy: 'buyer@kepler.local', uploadedAt: '2026-01-20T00:00:00.000Z' },
]

export const ENTERPRISE_COMMENTS: EnterpriseComment[] = [
  { id: 'cmt-1', entityType: 'SALES_ORDER', entityId: '1', threadId: 'thr-1', author: 'Ayşe Yılmaz', authorRole: 'Planlayıcı', body: 'EXF tarihi müşteri ile teyit edildi @Mehmet', mentions: ['Mehmet Tekin'], reactions: [{ emoji: '👍', userId: 'emp-mt' }], createdAt: '2026-02-05T10:00:00.000Z' },
  { id: 'cmt-2', entityType: 'PRODUCT_CARD', entityId: '1', threadId: 'thr-2', author: 'Zeynep Kaya', authorRole: 'QC', body: 'Ölçü tablosu revizyon 2 onaylandı', mentions: [], reactions: [], createdAt: '2026-02-06T14:00:00.000Z' },
]

export const ENTERPRISE_WATCHERS: EnterpriseWatcher[] = [
  { id: 'wch-1', entityType: 'SALES_ORDER', entityId: '1', userId: 'emp-pl', userName: 'Ayşe Yılmaz', subscription: 'All', createdAt: '2026-01-20T00:00:00.000Z' },
  { id: 'wch-2', entityType: 'SALES_ORDER', entityId: '1', userId: 'emp-qc', userName: 'Zeynep Kaya', subscription: 'StatusChanges', createdAt: '2026-01-21T00:00:00.000Z' },
]

export const QUALITY_INSPECTION_PLANS = [
  { id: 'qip-1', code: 'AQL-2.5', name: 'AQL 2.5 Final Inspection', productGroupId: 'pg-tshirt', aqlLevel: 2.5 },
  { id: 'qip-2', code: 'INLINE-SEW', name: 'Inline Sewing Inspection', productGroupId: 'pg-polo', aqlLevel: 0 },
]

export const QUALITY_DEFECT_CODES = [
  { id: 'def-major', code: 'MAJOR', name: 'Major Defect' },
  { id: 'def-minor', code: 'MINOR', name: 'Minor Defect' },
  { id: 'def-critical', code: 'CRITICAL', name: 'Critical Defect' },
]

export const WAREHOUSE_ZONES = [
  { id: 'zone-kms-a', warehouseId: 'wh-kms', code: 'ZONE-A', name: 'Kumaş A Bölgesi', temperature: '20C', securityLevel: 'Standard' },
  { id: 'zone-kms-b', warehouseId: 'wh-kms', code: 'ZONE-B', name: 'Kumaş B Bölgesi', parentId: 'zone-kms-a', temperature: '20C', securityLevel: 'Standard' },
]

export const WAREHOUSE_LOCATIONS = [
  { id: 'loc-kms-a1', zoneId: 'zone-kms-a', code: 'A1-SHELF-01', name: 'Raf 01', capacity: 500 },
  { id: 'loc-kms-a2', zoneId: 'zone-kms-a', code: 'A1-BIN-03', name: 'Bin 03', capacity: 100 },
]

export const ENTERPRISE_TIMELINE_SEED: EnterpriseTimelineEntry[] = [
  { id: 'etl-1', entityType: 'SALES_ORDER', entityId: '1', entityCode: 'SIP-2026-0100', occurredAt: '2026-01-20T08:00:00.000Z', actor: 'buyer@lcw.com', action: 'CREATE', reason: 'Müşteri PO alındı' },
  { id: 'etl-2', entityType: 'SALES_ORDER', entityId: '1', entityCode: 'SIP-2026-0100', occurredAt: '2026-01-20T09:00:00.000Z', actor: 'system', action: 'BUSINESS_RULE', businessRuleId: 'BR-01-ORDER-MRP-PR', reason: 'MRP ve PR otomatik oluşturuldu' },
  { id: 'etl-3', entityType: 'PRODUCT_CARD', entityId: '1', entityCode: 'URN-SS26-1000', occurredAt: '2026-02-01T00:00:00.000Z', actor: 'planner@kepler.local', action: 'APPROVE', approvalId: 'mda-000001', reason: 'Teknik föy onaylandı' },
  { id: 'etl-4', entityType: 'SALES_ORDER', entityId: '1', entityCode: 'SIP-2026-0100', occurredAt: '2026-02-10T11:00:00.000Z', actor: 'brain', action: 'BRAIN_SUGGESTION', brainSuggestionId: 'bsg-split-001', reason: 'Split production önerisi oluşturuldu' },
]
