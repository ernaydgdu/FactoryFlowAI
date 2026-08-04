import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExportDocumentSet } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExportDocumentSetRepository } from '@/domain/ports/persistence/aggregates/export-document-set.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ExportDocumentSetInMemoryRepository implements IExportDocumentSetRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedExportDocumentSet | null {
    return (
      this.stores.exportDocumentSets.find(
        (d) => d.tenantId === tenantId && d.id === id && !d.deletedAt,
      ) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedExportDocumentSet | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedExportDocumentSet | null {
    return this.findByDocumentSetNo(tenantId, code)
  }

  findByDocumentSetNo(tenantId: string, documentSetNo: string): PersistedExportDocumentSet | null {
    return (
      this.stores.exportDocumentSets.find(
        (d) => d.tenantId === tenantId && d.documentSetNo === documentSetNo && !d.deletedAt,
      ) ?? null
    )
  }

  findByInvoiceNo(tenantId: string, invoiceNo: string): PersistedExportDocumentSet | null {
    return (
      this.stores.exportDocumentSets.find(
        (d) =>
          d.tenantId === tenantId &&
          d.commercialInvoice.invoiceNo === invoiceNo &&
          !d.deletedAt,
      ) ?? null
    )
  }

  findByShipmentId(tenantId: string, shipmentId: string): PersistedExportDocumentSet[] {
    return this.stores.exportDocumentSets.filter(
      (d) => d.tenantId === tenantId && d.shipmentId === shipmentId && !d.deletedAt,
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedExportDocumentSet | null {
    return (
      this.stores.exportDocumentSets.find(
        (d) => d.tenantId === tenantId && d.idempotencyKey === idempotencyKey && !d.deletedAt,
      ) ?? null
    )
  }

  nextDocumentSetCounter(): number {
    this.stores.exportDocumentSetCounter += 1
    return this.stores.exportDocumentSetCounter
  }

  nextInvoiceCounter(): number {
    this.stores.commercialInvoiceCounter += 1
    return this.stores.commercialInvoiceCounter
  }

  save(
    tenantId: string,
    aggregate: PersistedExportDocumentSet,
    options?: { expectedVersion?: number },
  ): PersistedExportDocumentSet {
    const idx = this.stores.exportDocumentSets.findIndex(
      (d) => d.tenantId === tenantId && d.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.exportDocumentSets[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError(
          'ExportDocumentSet',
          aggregate.id,
          options.expectedVersion,
          current.version,
        )
      }
    }
    const now = new Date().toISOString()
    const next: PersistedExportDocumentSet = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.exportDocumentSets[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.exportDocumentSets[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.exportDocumentSets[idx] = next
    else this.stores.exportDocumentSets.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.exportDocumentSets.findIndex((d) => d.tenantId === tenantId && d.id === id)
    if (idx >= 0) {
      this.stores.exportDocumentSets[idx] = {
        ...this.stores.exportDocumentSets[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.exportDocumentSets.some(
      (d) => d.tenantId === tenantId && d.id === id && !d.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedExportDocumentSet> {
    const rows = this.stores.exportDocumentSets
      .filter((d) => d.tenantId === tenantId && !d.deletedAt)
      .sort((a, b) => b.documentSetNo.localeCompare(a.documentSetNo))
    return paginate(rows, page)
  }
}
