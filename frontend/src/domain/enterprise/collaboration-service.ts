/**
 * Enterprise collaboration — documents, comments, followers (platform üzerine)
 */
import { getAttachments } from '../platform/services/attachment-service'
import { getComments } from '../platform/services/comment-service'
import { getWatchers } from '../platform/services/watcher-service'
import type { EnterpriseComment, EnterpriseDocument, EnterpriseWatcher } from './types'
import {
  ENTERPRISE_COMMENTS,
  ENTERPRISE_DOCUMENTS,
  ENTERPRISE_WATCHERS,
} from './enterprise-seed'
import type { EnterpriseEntityType } from './types'

export function getEnterpriseDocuments(entityType: EnterpriseEntityType, entityId: string): EnterpriseDocument[] {
  const seeded = ENTERPRISE_DOCUMENTS.filter((d) => d.entityType === entityType && d.entityId === entityId)
  const platform = getAttachments(mapEntityType(entityType), entityId).map((a) => ({
    id: a.id,
    entityType,
    entityId,
    kind: mapFileType(a.fileType) as EnterpriseDocument['kind'],
    fileName: a.fileName,
    mimeType: a.mimeType,
    revisionNo: 1,
    uploadedBy: a.uploadedBy,
    uploadedAt: a.uploadedAt,
  }))
  return [...seeded, ...platform]
}

export function getEnterpriseComments(entityType: EnterpriseEntityType, entityId: string): EnterpriseComment[] {
  const seeded = ENTERPRISE_COMMENTS.filter((c) => c.entityType === entityType && c.entityId === entityId)
  const platform = getComments(mapCommentEntityType(entityType), entityId).map((c) => ({
    id: c.id,
    entityType,
    entityId,
    threadId: `thr-${entityId}`,
    author: c.author,
    authorRole: c.authorRole,
    body: c.body,
    mentions: extractMentions(c.body),
    reactions: [],
    createdAt: c.createdAt,
  }))
  return [...seeded, ...platform]
}

export function getEnterpriseWatchers(entityType: EnterpriseEntityType, entityId: string): EnterpriseWatcher[] {
  const seeded = ENTERPRISE_WATCHERS.filter((w) => w.entityType === entityType && w.entityId === entityId)
  const platform = getWatchers(entityType, entityId).map((w) => ({
    id: w.id,
    entityType,
    entityId,
    userId: w.userId,
    userName: w.userName,
    subscription: 'All' as const,
    createdAt: w.createdAt,
  }))
  return [...seeded, ...platform]
}

function extractMentions(body: string): string[] {
  return [...body.matchAll(/@(\w+)/g)].map((m) => m[1])
}

function mapEntityType(t: EnterpriseEntityType): 'ProductCard' | 'SalesOrder' | 'ProductionOrder' | 'PurchaseOrder' | 'QualityInspection' {
  if (t === 'PRODUCT_CARD') return 'ProductCard'
  if (t === 'SALES_ORDER') return 'SalesOrder'
  if (t === 'PRODUCTION_ORDER') return 'ProductionOrder'
  if (t === 'PURCHASE_ORDER') return 'PurchaseOrder'
  return 'QualityInspection'
}

function mapCommentEntityType(t: EnterpriseEntityType): 'SalesOrder' | 'ProductionOrder' | 'PurchaseOrder' | 'PurchaseRequisition' {
  if (t === 'PRODUCTION_ORDER') return 'ProductionOrder'
  if (t === 'PURCHASE_ORDER') return 'PurchaseOrder'
  return 'SalesOrder'
}

function mapFileType(ft: string): string {
  const map: Record<string, string> = {
    'Teknik Föy': 'TechPack',
    'Ölçü Tablosu': 'MeasurementTable',
    'Kalıp PDF': 'PatternFile',
    Resim: 'Photo',
    'Test Raporu': 'LabReport',
  }
  return map[ft] ?? 'PDF'
}

export function countCollaborationCoverage(): { documents: number; comments: number; watchers: number } {
  return {
    documents: ENTERPRISE_DOCUMENTS.length,
    comments: ENTERPRISE_COMMENTS.length,
    watchers: ENTERPRISE_WATCHERS.length,
  }
}
