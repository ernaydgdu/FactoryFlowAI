import { runCommandInTransaction } from '@/application/core/command-transaction'
import type { AuditContext } from '@/domain/platform/services/audit-service'
import {
  platformActivateRevision,
  platformApproveBomStep,
  platformCreateRevision,
  platformSubmitBomApproval,
} from '@/domain/platform/services/platform-orchestrator'
import { createRevision } from '@/domain/platform/services/versioning-service'

export function commandSubmitBomApproval(
  entityId: string,
  entityKey: string,
  submittedBy: string,
  audit: AuditContext,
) {
  return runCommandInTransaction(() =>
    platformSubmitBomApproval(entityId, entityKey, submittedBy, audit),
  )
}

export function commandApproveBomStep(
  workflowId: string,
  actedBy: string,
  audit: AuditContext,
  comment?: string,
) {
  return runCommandInTransaction(() => platformApproveBomStep(workflowId, actedBy, audit, comment))
}

export function commandActivateRevision(
  recordId: string,
  approvedBy: string,
  audit: AuditContext,
) {
  return runCommandInTransaction(() => platformActivateRevision(recordId, approvedBy, audit))
}

export function commandCreateRevision<T extends Record<string, unknown>>(
  input: Parameters<typeof createRevision<T>>[0],
  audit: AuditContext,
) {
  return runCommandInTransaction(() => platformCreateRevision(input, audit))
}
