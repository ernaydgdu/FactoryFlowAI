import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedSplitExecution } from '@/domain/ports/persistence/persistence-aggregates'
import type { ISplitExecutionRepository } from '@/domain/ports/persistence/aggregates/split-execution.repository'
import type { SplitExecutionRecord } from '@/domain/execution-platform/execution-types'

import { conflictError, paginate, withPersistenceMetadata } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class SplitExecutionInMemoryRepository implements ISplitExecutionRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedSplitExecution | null {
    return this.stores.splitExecutions.find((s) => s.tenantId === tenantId && s.id === id && !s.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedSplitExecution | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedSplitExecution | null {
    return this.findById(tenantId, code)
  }

  save(tenantId: string, aggregate: PersistedSplitExecution, options?: { expectedVersion?: number }): PersistedSplitExecution {
    const idx = this.stores.splitExecutions.findIndex((s) => s.tenantId === tenantId && s.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.splitExecutions[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('SplitExecution', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedSplitExecution = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.splitExecutions[idx]!.version + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.splitExecutions[idx] = next
    else this.stores.splitExecutions.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.splitExecutions.findIndex((s) => s.tenantId === tenantId && s.id === id)
    if (idx >= 0) {
      this.stores.splitExecutions[idx] = {
        ...this.stores.splitExecutions[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.splitExecutions.some((s) => s.tenantId === tenantId && s.id === id && !s.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedSplitExecution> {
    const items = this.stores.splitExecutions.filter((s) => s.tenantId === tenantId && !s.deletedAt)
    return paginate(items, page)
  }

  findByParentProductionOrderNo(tenantId: string, parentProductionOrderNo: string): PersistedSplitExecution[] {
    return this.stores.splitExecutions.filter(
      (s) => s.tenantId === tenantId && s.parentProductionOrderNo === parentProductionOrderNo && !s.deletedAt,
    )
  }

  seedFromLegacy(records: SplitExecutionRecord[]): void {
    this.stores.splitExecutions = records.map((r) => withPersistenceMetadata(r, 'kepler-default'))
  }

  nextSplitId(): string {
    this.stores.splitCounter += 1
    return `spl-${String(this.stores.splitCounter).padStart(6, '0')}`
  }
}
