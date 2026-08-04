import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedSupplierQuotation } from '@/domain/ports/persistence/persistence-aggregates'
import type { ISupplierQuotationRepository } from '@/domain/ports/persistence/aggregates/supplier-quotation.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class SupplierQuotationInMemoryRepository implements ISupplierQuotationRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedSupplierQuotation | null {
    return (
      this.stores.supplierQuotations.find((q) => q.tenantId === tenantId && q.id === id && !q.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedSupplierQuotation | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedSupplierQuotation | null {
    return this.findByQuotationNo(tenantId, code)
  }

  findByQuotationNo(tenantId: string, quotationNo: string): PersistedSupplierQuotation | null {
    return (
      this.stores.supplierQuotations.find(
        (q) => q.tenantId === tenantId && q.quotationNo === quotationNo && !q.deletedAt,
      ) ?? null
    )
  }

  findByRfqId(tenantId: string, rfqId: string): PersistedSupplierQuotation[] {
    return this.stores.supplierQuotations.filter(
      (q) => q.tenantId === tenantId && q.rfqId === rfqId && !q.deletedAt,
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedSupplierQuotation,
    options?: { expectedVersion?: number },
  ): PersistedSupplierQuotation {
    const idx = this.stores.supplierQuotations.findIndex(
      (q) => q.tenantId === tenantId && q.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.supplierQuotations[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('SupplierQuotation', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedSupplierQuotation = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.supplierQuotations[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.supplierQuotations[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.supplierQuotations[idx] = next
    else this.stores.supplierQuotations.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.supplierQuotations.findIndex((q) => q.tenantId === tenantId && q.id === id)
    if (idx >= 0) {
      this.stores.supplierQuotations[idx] = {
        ...this.stores.supplierQuotations[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.supplierQuotations.some(
      (q) => q.tenantId === tenantId && q.id === id && !q.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedSupplierQuotation> {
    const rows = this.stores.supplierQuotations
      .filter((q) => q.tenantId === tenantId && !q.deletedAt)
      .sort((a, b) => b.quotationNo.localeCompare(a.quotationNo))
    return paginate(rows, page)
  }
}
