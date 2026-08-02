import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedApprovalWorkflow } from '@/domain/ports/persistence/persistence-aggregates'
import type { IApprovalWorkflowRepository } from '@/domain/ports/persistence/aggregates/approval-workflow.repository'
import type { ApprovalWorkflow } from '@/domain/platform/types'

import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'
import { conflictError } from '../in-memory-helpers'

export class ApprovalWorkflowInMemoryRepository implements IApprovalWorkflowRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedApprovalWorkflow | null {
    return this.stores.approvalWorkflows.find((w) => w.tenantId === tenantId && w.id === id) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedApprovalWorkflow | null {
    return this.findById(tenantId, id)
  }

  save(tenantId: string, aggregate: PersistedApprovalWorkflow, options?: { expectedVersion?: number }): PersistedApprovalWorkflow {
    const idx = this.stores.approvalWorkflows.findIndex((w) => w.tenantId === tenantId && w.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.approvalWorkflows[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('ApprovalWorkflow', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedApprovalWorkflow = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.approvalWorkflows[idx]!.version + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.approvalWorkflows[idx] = next
    else this.stores.approvalWorkflows.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.approvalWorkflows.findIndex((w) => w.tenantId === tenantId && w.id === id)
    if (idx >= 0) {
      this.stores.approvalWorkflows[idx] = {
        ...this.stores.approvalWorkflows[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.approvalWorkflows.some((w) => w.tenantId === tenantId && w.id === id && !w.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedApprovalWorkflow> {
    let items = this.stores.approvalWorkflows.filter((w) => w.tenantId === tenantId && !w.deletedAt)
    const status = filter.status as string | undefined
    if (status) items = items.filter((w) => w.status === status)
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  findByEntity(tenantId: string, entityType: string, entityId: string): PersistedApprovalWorkflow[] {
    return this.stores.approvalWorkflows.filter(
      (w) => w.tenantId === tenantId && w.entityType === entityType && w.entityId === entityId && !w.deletedAt,
    )
  }

  cursorPending(tenantId: string, approverRole: string, page: CursorPage): PageResult<PersistedApprovalWorkflow> {
    const items = this.stores.approvalWorkflows.filter((w) => {
      if (w.tenantId !== tenantId || w.deletedAt || w.status !== 'Pending') return false
      const step = w.steps[w.currentStepIndex]
      return step?.role === approverRole && step.status === 'Pending'
    })
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  replaceAll(workflows: ApprovalWorkflow[]): void {
    this.stores.seedApprovalWorkflows(workflows)
  }

  seedFromLegacy(workflows: ApprovalWorkflow[]): void {
    this.replaceAll(workflows)
  }

  allAsLegacy(): ApprovalWorkflow[] {
    return this.stores.approvalWorkflows
      .filter((w) => !w.deletedAt)
      .map(
        ({
          tenantId: _t,
          version: _v,
          schemaVersion: _s,
          createdAt: _c,
          updatedAt: _u,
          deletedAt: _d,
          ...rest
        }) => rest as ApprovalWorkflow,
      )
  }
}
