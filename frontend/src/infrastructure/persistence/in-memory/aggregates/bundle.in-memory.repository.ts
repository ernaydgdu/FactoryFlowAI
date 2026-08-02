import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedBundle } from '@/domain/ports/persistence/persistence-aggregates'
import type { IBundleRepository } from '@/domain/ports/persistence/aggregates/bundle.repository'
import type { Bundle } from '@/domain/execution-platform/execution-types'

import { conflictError, paginate, withPersistenceMetadata } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class BundleInMemoryRepository implements IBundleRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedBundle | null {
    return this.stores.bundles.find((b) => b.tenantId === tenantId && b.id === id && !b.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedBundle | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedBundle | null {
    return this.stores.bundles.find((b) => b.tenantId === tenantId && b.bundleNo === code && !b.deletedAt) ?? null
  }

  save(tenantId: string, aggregate: PersistedBundle, options?: { expectedVersion?: number }): PersistedBundle {
    const idx = this.stores.bundles.findIndex((b) => b.tenantId === tenantId && b.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.bundles[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('Bundle', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedBundle = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.bundles[idx]!.version + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.bundles[idx] = next
    else this.stores.bundles.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.bundles.findIndex((b) => b.tenantId === tenantId && b.id === id)
    if (idx >= 0) {
      this.stores.bundles[idx] = {
        ...this.stores.bundles[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.bundles.some((b) => b.tenantId === tenantId && b.id === id && !b.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedBundle> {
    let items = this.stores.bundles.filter((b) => b.tenantId === tenantId && !b.deletedAt)
    const productionOrderNo = filter.productionOrderNo as string | undefined
    if (productionOrderNo) items = items.filter((b) => b.productionOrderNo === productionOrderNo)
    return paginate(items, page)
  }

  findByBarcode(tenantId: string, barcode: string): PersistedBundle | null {
    return this.stores.bundles.find((b) => b.tenantId === tenantId && b.barcode === barcode && !b.deletedAt) ?? null
  }

  cursorByProductionOrderNo(
    tenantId: string,
    productionOrderNo: string,
    page: CursorPage,
  ): PageResult<PersistedBundle> {
    return this.cursor(tenantId, { productionOrderNo }, page)
  }

  cursorByCurrentOperation(
    tenantId: string,
    operationCode: string,
    page: CursorPage,
  ): PageResult<PersistedBundle> {
    const items = this.stores.bundles.filter(
      (b) => b.tenantId === tenantId && b.currentOperationCode === operationCode && !b.deletedAt,
    )
    return paginate(items, page)
  }

  seedFromLegacy(bundles: Bundle[]): void {
    this.stores.bundles = bundles.map((b) => ({
      ...withPersistenceMetadata(b, 'kepler-default'),
      tickets: [],
    }))
  }

  nextBundleId(): string {
    this.stores.bundleCounter += 1
    return `bnd-${String(this.stores.bundleCounter).padStart(6, '0')}`
  }

  nextTicketId(): string {
    this.stores.ticketCounter += 1
    return `btk-${String(this.stores.ticketCounter).padStart(6, '0')}`
  }

  nextTransferId(): string {
    this.stores.wipTransferCounter += 1
    return `wipt-${String(this.stores.wipTransferCounter).padStart(6, '0')}`
  }
}
