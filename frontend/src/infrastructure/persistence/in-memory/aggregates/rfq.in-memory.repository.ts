import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedRequestForQuotation } from '@/domain/ports/persistence/persistence-aggregates'
import type { IRequestForQuotationRepository } from '@/domain/ports/persistence/aggregates/rfq.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class RfqInMemoryRepository implements IRequestForQuotationRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedRequestForQuotation | null {
    return this.stores.rfqs.find((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedRequestForQuotation | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedRequestForQuotation | null {
    return this.findByRfqNo(tenantId, code)
  }

  findByRfqNo(tenantId: string, rfqNo: string): PersistedRequestForQuotation | null {
    return (
      this.stores.rfqs.find((r) => r.tenantId === tenantId && r.rfqNo === rfqNo && !r.deletedAt) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedRequestForQuotation,
    options?: { expectedVersion?: number },
  ): PersistedRequestForQuotation {
    const idx = this.stores.rfqs.findIndex((r) => r.tenantId === tenantId && r.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.rfqs[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('RFQ', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedRequestForQuotation = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.rfqs[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.rfqs[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.rfqs[idx] = next
    else this.stores.rfqs.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.rfqs.findIndex((r) => r.tenantId === tenantId && r.id === id)
    if (idx >= 0) {
      this.stores.rfqs[idx] = {
        ...this.stores.rfqs[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.rfqs.some((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedRequestForQuotation> {
    const rows = this.stores.rfqs
      .filter((r) => r.tenantId === tenantId && !r.deletedAt)
      .sort((a, b) => b.rfqNo.localeCompare(a.rfqNo))
    return paginate(rows, page)
  }
}
