import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedCostClosing } from '@/domain/ports/persistence/persistence-aggregates'
import type { ICostClosingRepository } from '@/domain/ports/persistence/aggregates/cost-closing.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class CostClosingInMemoryRepository implements ICostClosingRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedCostClosing | null {
    return (
      this.stores.costClosings.find(
        (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedCostClosing | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedCostClosing | null {
    return this.findByBatchNo(tenantId, code)
  }

  findByBatchNo(tenantId: string, batchNo: string): PersistedCostClosing | null {
    return (
      this.stores.costClosings.find(
        (e) => e.tenantId === tenantId && e.batchNo === batchNo && !e.deletedAt,
      ) ?? null
    )
  }

  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedCostClosing | null {
    return (
      this.stores.costClosings.find(
        (e) =>
          e.tenantId === tenantId &&
          e.salesOrderId === salesOrderId &&
          e.status !== 'Reversed' &&
          !e.deletedAt,
      ) ?? null
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedCostClosing | null {
    return (
      this.stores.costClosings.find(
        (e) => e.tenantId === tenantId && e.idempotencyKey === idempotencyKey && !e.deletedAt,
      ) ?? null
    )
  }

  nextBatchCounter(): number {
    this.stores.costClosingCounter += 1
    return this.stores.costClosingCounter
  }

  save(
    tenantId: string,
    aggregate: PersistedCostClosing,
    options?: { expectedVersion?: number },
  ): PersistedCostClosing {
    const idx = this.stores.costClosings.findIndex(
      (e) => e.tenantId === tenantId && e.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.costClosings[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError(
          'CostClosing',
          aggregate.id,
          options.expectedVersion,
          current.version,
        )
      }
    }
    const now = new Date().toISOString()
    const next: PersistedCostClosing = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.costClosings[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.costClosings[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.costClosings[idx] = next
    else this.stores.costClosings.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.costClosings.findIndex((e) => e.tenantId === tenantId && e.id === id)
    if (idx >= 0) {
      this.stores.costClosings[idx] = {
        ...this.stores.costClosings[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.costClosings.some(
      (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedCostClosing> {
    let rows = this.stores.costClosings.filter((e) => e.tenantId === tenantId && !e.deletedAt)
    const status = filter.status
    if (typeof status === 'string') {
      rows = rows.filter((e) => e.status === status)
    }
    rows = rows.sort((a, b) => b.batchNo.localeCompare(a.batchNo))
    return paginate(rows, page)
  }
}
