import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExecutionContext } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExecutionContextRepository } from '@/domain/ports/persistence/aggregates/execution-context.repository'
import type { ExecutionContext } from '@/domain/execution-platform/execution-types'

import { conflictError, paginate, withPersistenceMetadata } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ExecutionContextInMemoryRepository implements IExecutionContextRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedExecutionContext | null {
    return this.stores.executionContexts.find((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedExecutionContext | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedExecutionContext | null {
    return this.findByProductionOrderNo(tenantId, code)
  }

  save(tenantId: string, aggregate: PersistedExecutionContext, options?: { expectedVersion?: number }): PersistedExecutionContext {
    const idx = this.stores.executionContexts.findIndex((c) => c.tenantId === tenantId && c.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.executionContexts[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('ExecutionContext', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedExecutionContext = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.executionContexts[idx]!.version + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.executionContexts[idx] = next
    else this.stores.executionContexts.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.executionContexts.findIndex((c) => c.tenantId === tenantId && c.id === id)
    if (idx >= 0) {
      this.stores.executionContexts[idx] = {
        ...this.stores.executionContexts[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.executionContexts.some((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedExecutionContext> {
    const items = this.stores.executionContexts.filter((c) => c.tenantId === tenantId && !c.deletedAt)
    return paginate(items, page)
  }

  findByProductionOrderNo(tenantId: string, productionOrderNo: string): PersistedExecutionContext | null {
    return (
      this.stores.executionContexts.find(
        (c) => c.tenantId === tenantId && c.productionOrderNo === productionOrderNo && !c.deletedAt,
      ) ?? null
    )
  }

  seedFromLegacy(contexts: ExecutionContext[]): void {
    this.stores.executionContexts = contexts.map((c) => ({
      ...withPersistenceMetadata(c, 'kepler-default'),
      operationExecutions: [],
    }))
  }

  nextContextId(): string {
    this.stores.executionContextCounter += 1
    return `exectx-${String(this.stores.executionContextCounter).padStart(6, '0')}`
  }

  nextOperationId(): string {
    this.stores.operationCounter += 1
    return `opex-${String(this.stores.operationCounter).padStart(6, '0')}`
  }

  allAsLegacy(): ExecutionContext[] {
    return this.stores.executionContexts
      .filter((c) => !c.deletedAt)
      .map(({ tenantId: _t, version: _v, updatedAt: _u, deletedAt: _d, operationExecutions: _oe, ...rest }) => rest as ExecutionContext)
  }
}
