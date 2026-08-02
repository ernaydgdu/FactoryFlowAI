import type { MasterDataApprovalRequest, MasterDataLifecycleStatus } from './types'
import type { MasterDataEntityType } from '../types'
import { recordMasterDataCreate } from './audit-service'
import type { AuditContext } from '../../platform/services/audit-service'
import { publishMasterDataBrainEvent } from './brain-change-feed'

const approvalStore: MasterDataApprovalRequest[] = []
let approvalCounter = 0

function nextApprovalId(): string {
  approvalCounter += 1
  return `mda-${String(approvalCounter).padStart(6, '0')}`
}

export function submitMasterDataForApproval(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  submittedBy: string,
): MasterDataApprovalRequest {
  const request: MasterDataApprovalRequest = {
    id: nextApprovalId(),
    entityType,
    entityId,
    entityCode,
    lifecycleStatus: 'PendingApproval',
    submittedBy,
    submittedAt: new Date().toISOString(),
  }
  approvalStore.push(request)
  publishMasterDataBrainEvent({
    entityType,
    entityId,
    entityCode,
    changeType: 'updated',
    summary: `${entityCode} onaya gönderildi`,
    occurredAt: request.submittedAt,
  })
  return request
}

export function approveMasterDataChange(
  approvalId: string,
  approvedBy: string,
  context: AuditContext,
  entityPayload: Record<string, unknown>,
): MasterDataApprovalRequest | undefined {
  const request = approvalStore.find((a) => a.id === approvalId)
  if (!request) return undefined

  request.lifecycleStatus = 'Active'
  request.approvedBy = approvedBy
  request.approvedAt = new Date().toISOString()

  recordMasterDataCreate(request.entityType, { ...entityPayload, lifecycleStatus: 'Active' }, context)
  publishMasterDataBrainEvent({
    entityType: request.entityType,
    entityId: request.entityId,
    entityCode: request.entityCode,
    changeType: 'approved',
    summary: `${request.entityCode} onaylandı ve aktifleştirildi`,
    occurredAt: request.approvedAt,
  })

  return request
}

export function getMasterDataLifecycleStatus(entityId: string): MasterDataLifecycleStatus {
  const pending = approvalStore.find((a) => a.entityId === entityId && a.lifecycleStatus === 'PendingApproval')
  if (pending) return 'PendingApproval'
  return 'Active'
}

export function getPendingMasterDataApprovals(): MasterDataApprovalRequest[] {
  return approvalStore.filter((a) => a.lifecycleStatus === 'PendingApproval')
}

export function countApprovalCoverage(): { requests: number; pending: number; approved: number } {
  return {
    requests: approvalStore.length,
    pending: approvalStore.filter((a) => a.lifecycleStatus === 'PendingApproval').length,
    approved: approvalStore.filter((a) => a.approvedAt).length,
  }
}
