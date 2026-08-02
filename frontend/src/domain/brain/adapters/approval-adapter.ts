import { getAllApprovalWorkflows, getPendingApprovals } from '../../platform/services/approval-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const approvalAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'APPROVAL',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const entityId = context.scope.entityId
    const all = getAllApprovalWorkflows()
    const filtered = entityId ? all.filter((w) => w.entityId === entityId) : all
    const pending = getPendingApprovals('Planlama')

    return {
      sourceId: 'APPROVAL',
      fetchedAt: new Date().toISOString(),
      entityKeys: filtered.map((w) => w.id),
      summary: `${filtered.length} onay akışı, ${pending.length} bekleyen`,
      recordCount: filtered.length,
      payload: {
        workflows: filtered.map((w) => ({
          id: w.id,
          entityId: w.entityId,
          entityKey: w.entityKey,
          status: w.status,
          currentStep: w.currentStepIndex,
          stepCount: w.steps.length,
        })),
        pendingCount: pending.length,
      },
    }
  },
}
