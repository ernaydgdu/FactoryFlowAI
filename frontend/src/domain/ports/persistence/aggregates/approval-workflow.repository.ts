/** P18 — ApprovalWorkflow aggregate port */
import type { ApprovalWorkflow } from '../../../platform/types'
import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedApprovalWorkflow } from '../persistence-aggregates'
import type { IAggregateRepository } from '../repository.base'

export interface IApprovalWorkflowRepository extends IAggregateRepository<PersistedApprovalWorkflow> {
  findByEntity(tenantId: string, entityType: string, entityId: string): PersistedApprovalWorkflow[]
  cursorPending(tenantId: string, approverRole: string, page: CursorPage): PageResult<PersistedApprovalWorkflow>
  seedFromLegacy(workflows: ApprovalWorkflow[]): void
}
