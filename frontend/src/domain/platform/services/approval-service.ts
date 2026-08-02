import type { ApprovalStep, ApprovalWorkflow, ApprovalWorkflowType } from '../types'

const BOM_APPROVAL_STEPS: Omit<ApprovalStep, 'id' | 'status'>[] = [
  { role: 'Planlama Müdürü', order: 1 },
  { role: 'Satın Alma', order: 2 },
  { role: 'Üretim Müdürü', order: 3 },
]

const workflowStore: ApprovalWorkflow[] = []

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
  workflowStore.push(workflow)
  return workflow
}

export function approveStep(
  workflowId: string,
  actedBy: string,
  comment?: string,
): ApprovalWorkflow | null {
  const workflow = workflowStore.find((w) => w.id === workflowId)
  if (!workflow || workflow.status !== 'Pending') return null

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
  return workflow
}

export function rejectStep(
  workflowId: string,
  actedBy: string,
  comment: string,
): ApprovalWorkflow | null {
  const workflow = workflowStore.find((w) => w.id === workflowId)
  if (!workflow || workflow.status !== 'Pending') return null

  const step = workflow.steps[workflow.currentStepIndex]
  if (!step) return null

  step.status = 'Rejected'
  step.actedBy = actedBy
  step.actedAt = new Date().toISOString()
  step.comment = comment
  workflow.status = 'Rejected'
  workflow.completedAt = new Date().toISOString()
  return workflow
}

export function getWorkflow(id: string): ApprovalWorkflow | undefined {
  return workflowStore.find((w) => w.id === id)
}

export function getWorkflowsForEntity(entityId: string): ApprovalWorkflow[] {
  return workflowStore.filter((w) => w.entityId === entityId)
}

export function getPendingApprovals(role: string): ApprovalWorkflow[] {
  return workflowStore.filter((w) => {
    if (w.status !== 'Pending') return false
    const step = w.steps[w.currentStepIndex]
    return step?.role === role && step.status === 'Pending'
  })
}

export function seedApprovalWorkflows(workflows: ApprovalWorkflow[]): void {
  workflowStore.length = 0
  workflowStore.push(...workflows)
}

export function getAllApprovalWorkflows(): ApprovalWorkflow[] {
  return [...workflowStore]
}

export function isFullyApproved(workflow: ApprovalWorkflow): boolean {
  return workflow.status === 'Approved'
}
