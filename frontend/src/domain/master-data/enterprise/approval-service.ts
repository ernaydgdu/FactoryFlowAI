import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { runDomainCommandInTransaction } from '@/domain/ports/persistence/command-transaction.port'
import { masterDataApprovals } from '../master-data-port-access'
import type { MasterDataApprovalRequest, MasterDataLifecycleStatus } from './types'
import type { MasterDataEntityType } from '../types'
import { recordMasterDataCreate } from './audit-service'
import type { AuditContext } from '../../platform/services/audit-service'
import { publishMasterDataBrainEvent } from './brain-change-feed'

function approvalsRepo() {
  return masterDataApprovals()
}

export function submitMasterDataForApproval(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  submittedBy: string,
): MasterDataApprovalRequest {
  return runDomainCommandInTransaction(() =>
    submitMasterDataForApprovalInternal(entityType, entityId, entityCode, submittedBy),
  )
}

function submitMasterDataForApprovalInternal(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  submittedBy: string,
): MasterDataApprovalRequest {
  const request: MasterDataApprovalRequest = {
    id: approvalsRepo().nextApprovalId(DEFAULT_TENANT_ID),
    entityType,
    entityId,
    entityCode,
    lifecycleStatus: 'PendingApproval',
    submittedBy,
    submittedAt: new Date().toISOString(),
  }
  approvalsRepo().save(DEFAULT_TENANT_ID, request)
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
  return runDomainCommandInTransaction(() =>
    approveMasterDataChangeInternal(approvalId, approvedBy, context, entityPayload),
  )
}

function approveMasterDataChangeInternal(
  approvalId: string,
  approvedBy: string,
  context: AuditContext,
  entityPayload: Record<string, unknown>,
): MasterDataApprovalRequest | undefined {
  const request = approvalsRepo().findById(DEFAULT_TENANT_ID, approvalId)
  if (!request) return undefined

  request.lifecycleStatus = 'Active'
  request.approvedBy = approvedBy
  request.approvedAt = new Date().toISOString()

  approvalsRepo().save(DEFAULT_TENANT_ID, request)

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
  return approvalsRepo().getLifecycleStatus(DEFAULT_TENANT_ID, entityId)
}

export function getPendingMasterDataApprovals(): MasterDataApprovalRequest[] {
  return approvalsRepo().findPending(DEFAULT_TENANT_ID)
}

export function countApprovalCoverage(): { requests: number; pending: number; approved: number } {
  const all = approvalsRepo().findAll(DEFAULT_TENANT_ID)
  return {
    requests: all.length,
    pending: all.filter((a) => a.lifecycleStatus === 'PendingApproval').length,
    approved: all.filter((a) => a.approvedAt).length,
  }
}
