import type { ApprovalStep, ApprovalWorkflow, ApprovalWorkflowType } from '../types'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../../ports/persistence/persistence-registry'
import type { PersistedApprovalWorkflow } from '../../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../../ports/persistence/persistence.types'

const BOM_APPROVAL_STEPS: Omit<ApprovalStep, 'id' | 'status'>[] = [
  { role: 'Planlama Müdürü', order: 1 },
  { role: 'Satın Alma', order: 2 },
  { role: 'Üretim Müdürü', order: 3 },
]

function approvalRepo() {
  return requireUnitOfWork().approvalWorkflows
}

function stripApprovalMeta(row: PersistedApprovalWorkflow): ApprovalWorkflow {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    createdAt: _c,
    updatedAt: _u,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

function buildSteps(template: Omit<ApprovalStep, 'id' | 'status'>[]): ApprovalStep[] {
  return template.map((s) => ({
    ...s,
    id: `step-${s.order}`,
    status: s.order === 1 ? 'Pending' : 'Pending',
  }))
}

export type SubmitApprovalInput = {
  workflowType: ApprovalWorkflowType
  entityType: string
  entityId: string
  entityKey: string
  submittedBy: string
}

export function submitForApproval(input: SubmitApprovalInput): ApprovalWorkflow {
  const steps =
    input.workflowType === 'BOM'
      ? buildSteps(BOM_APPROVAL_STEPS)
      : buildSteps([{ role: 'Onay Yetkilisi', order: 1 }])

  const workflow: ApprovalWorkflow = {
    id: `apw-${input.entityId}-${Date.now()}`,
    workflowType: input.workflowType,
    entityType: input.entityType,
    entityId: input.entityId,
    entityKey: input.entityKey,
    steps,
    currentStepIndex: 0,
    status: 'Pending',
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  }

  const now = workflow.submittedAt
  const persisted: PersistedApprovalWorkflow = {
    ...workflow,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  approvalRepo().save(DEFAULT_TENANT_ID, persisted)
  return workflow
}

export function approveStep(
  workflowId: string,
  actedBy: string,
  comment?: string,
): ApprovalWorkflow | null {
  const row = approvalRepo().findById(DEFAULT_TENANT_ID, workflowId)
  if (!row || row.status !== 'Pending') return null

  const workflow = stripApprovalMeta(row)
  const step = workflow.steps[workflow.currentStepIndex]
  if (!step) return null

  step.status = 'Approved'
  step.actedBy = actedBy
  step.actedAt = new Date().toISOString()
  step.comment = comment

  if (workflow.currentStepIndex < workflow.steps.length - 1) {
    workflow.currentStepIndex += 1
  } else {
    workflow.status = 'Approved'
    workflow.completedAt = new Date().toISOString()
  }

  approvalRepo().save(DEFAULT_TENANT_ID, { ...row, ...workflow, updatedAt: new Date().toISOString() })
  return workflow
}

export function rejectStep(
  workflowId: string,
  actedBy: string,
  comment: string,
): ApprovalWorkflow | null {
  const row = approvalRepo().findById(DEFAULT_TENANT_ID, workflowId)
  if (!row || row.status !== 'Pending') return null

  const workflow = stripApprovalMeta(row)
  const step = workflow.steps[workflow.currentStepIndex]
  if (!step) return null

  step.status = 'Rejected'
  step.actedBy = actedBy
  step.actedAt = new Date().toISOString()
  step.comment = comment
  workflow.status = 'Rejected'
  workflow.completedAt = new Date().toISOString()

  approvalRepo().save(DEFAULT_TENANT_ID, { ...row, ...workflow, updatedAt: new Date().toISOString() })
  return workflow
}

export function getWorkflow(id: string): ApprovalWorkflow | undefined {
  const row = approvalRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? stripApprovalMeta(row) : undefined
}

export function getWorkflowsForEntity(entityId: string): ApprovalWorkflow[] {
  const page = approvalRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.filter((w) => w.entityId === entityId).map(stripApprovalMeta)
}

export function getPendingApprovals(role: string): ApprovalWorkflow[] {
  const page = approvalRepo().cursorPending(DEFAULT_TENANT_ID, role, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripApprovalMeta)
}

export function seedApprovalWorkflows(workflows: ApprovalWorkflow[]): void {
  approvalRepo().seedFromLegacy(workflows)
}

export function getAllApprovalWorkflows(): ApprovalWorkflow[] {
  const page = approvalRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripApprovalMeta)
}

export function isFullyApproved(workflow: ApprovalWorkflow): boolean {
  return workflow.status === 'Approved'
}
