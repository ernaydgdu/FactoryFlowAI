import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  approveMasterDataChange,
  submitMasterDataForApproval,
} from '@/domain/master-data/enterprise/approval-service'
import { recordMasterDataCreate, recordMasterDataUpdate } from '@/domain/master-data/enterprise/audit-service'
import { setAttributeValue } from '@/domain/master-data/enterprise/attribute-service'
import type { AuditContext } from '@/domain/platform/services/audit-service'
import type { MasterDataEntityType } from '@/domain/master-data/types'

export function commandSubmitMasterDataForApproval(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  submittedBy: string,
) {
  return runCommandInTransaction(() =>
    submitMasterDataForApproval(entityType, entityId, entityCode, submittedBy),
  )
}

export function commandApproveMasterDataChange(
  approvalId: string,
  approvedBy: string,
  context: AuditContext,
  entityPayload: Record<string, unknown>,
) {
  return runCommandInTransaction(() =>
    approveMasterDataChange(approvalId, approvedBy, context, entityPayload),
  )
}

export function commandRecordMasterDataCreate(
  entityType: MasterDataEntityType,
  entity: Record<string, unknown>,
  context: AuditContext,
) {
  return runCommandInTransaction(() => recordMasterDataCreate(entityType, entity, context))
}

export function commandRecordMasterDataUpdate(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: AuditContext,
) {
  return runCommandInTransaction(() =>
    recordMasterDataUpdate(entityType, entityId, entityCode, oldValue, newValue, context),
  )
}

export function commandSetMasterDataAttributeValue(
  entityType: string,
  entityId: string,
  attributeCode: string,
  value: string | number | boolean,
) {
  return runCommandInTransaction(() => setAttributeValue(entityType, entityId, attributeCode, value))
}
