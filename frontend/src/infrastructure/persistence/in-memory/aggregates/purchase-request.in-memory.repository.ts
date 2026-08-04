import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPurchaseRequest } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseRequestRepository } from '@/domain/ports/persistence/aggregates/purchase-request.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class PurchaseRequestInMemoryRepository implements IPurchaseRequestRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedPurchaseRequest | null {
    return (
      this.stores.purchaseRequests.find((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedPurchaseRequest | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedPurchaseRequest | null {
    return this.findByPrNo(tenantId, code)
  }

  findByPrNo(tenantId: string, prNo: string): PersistedPurchaseRequest | null {
    return (
      this.stores.purchaseRequests.find(
        (r) => r.tenantId === tenantId && r.prNo === prNo && !r.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedPurchaseRequest,
    options?: { expectedVersion?: number },
  ): PersistedPurchaseRequest {
    const idx = this.stores.purchaseRequests.findIndex(
      (r) => r.tenantId === tenantId && r.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.purchaseRequests[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('PurchaseRequest', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedPurchaseRequest = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.purchaseRequests[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.purchaseRequests[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.purchaseRequests[idx] = next
    else this.stores.purchaseRequests.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.purchaseRequests.findIndex((r) => r.tenantId === tenantId && r.id === id)
    if (idx >= 0) {
      this.stores.purchaseRequests[idx] = {
        ...this.stores.purchaseRequests[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.purchaseRequests.some(
      (r) => r.tenantId === tenantId && r.id === id && !r.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedPurchaseRequest> {
    let rows = this.stores.purchaseRequests.filter((r) => r.tenantId === tenantId && !r.deletedAt)
    if (typeof filter.status === 'string') {
      rows = rows.filter((r) => r.status === filter.status)
    }
    rows.sort((a, b) => b.prNo.localeCompare(a.prNo))
    return paginate(rows, page)
  }

  cursorByStatus(
    tenantId: string,
    status: string,
    page: CursorPage,
  ): PageResult<PersistedPurchaseRequest> {
    return this.cursor(tenantId, { status }, page)
  }
}
