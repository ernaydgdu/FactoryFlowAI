import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedProductionOrder } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductionOrderRepository } from '@/domain/ports/persistence/aggregates/production-order.repository'
import type {
  ProductionOrderLifecycleRecord,
  ProductionOrderLifecycleStatus,
} from '@/domain/production-order/lifecycle-types'

import { conflictError, paginate, withPersistenceMetadata } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function toLegacy(row: PersistedProductionOrder): ProductionOrderLifecycleRecord {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

export class ProductionOrderInMemoryRepository implements IProductionOrderRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedProductionOrder | null {
    return this.stores.productionOrders.find((o) => o.tenantId === tenantId && o.id === id && !o.deletedAt) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedProductionOrder | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedProductionOrder | null {
    return this.findByProductionOrderNo(tenantId, code)
  }

  save(tenantId: string, aggregate: PersistedProductionOrder, options?: { expectedVersion?: number }): PersistedProductionOrder {
    const idx = this.stores.productionOrders.findIndex((o) => o.tenantId === tenantId && o.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.productionOrders[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('ProductionOrder', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next: PersistedProductionOrder = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.productionOrders[idx]!.version + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) this.stores.productionOrders[idx] = next
    else this.stores.productionOrders.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.productionOrders.findIndex((o) => o.tenantId === tenantId && o.id === id)
    if (idx >= 0) {
      this.stores.productionOrders[idx] = {
        ...this.stores.productionOrders[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.productionOrders.some((o) => o.tenantId === tenantId && o.id === id && !o.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedProductionOrder> {
    let items = this.stores.productionOrders.filter((o) => o.tenantId === tenantId && !o.deletedAt)
    const status = filter.status as ProductionOrderLifecycleStatus | undefined
    if (status) items = items.filter((o) => o.status === status)
    items = items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return paginate(items, page)
  }

  findByProductionOrderNo(tenantId: string, productionOrderNo: string): PersistedProductionOrder | null {
    return (
      this.stores.productionOrders.find(
        (o) => o.tenantId === tenantId && o.productionOrderNo === productionOrderNo && !o.deletedAt,
      ) ?? null
    )
  }

  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedProductionOrder[] {
    return this.stores.productionOrders.filter(
      (o) => o.tenantId === tenantId && o.salesOrderId === salesOrderId && !o.deletedAt,
    )
  }

  cursorByStatus(
    tenantId: string,
    status: ProductionOrderLifecycleStatus,
    page: CursorPage,
  ): PageResult<PersistedProductionOrder> {
    return this.cursor(tenantId, { status }, page)
  }

  seedFromLegacy(records: ProductionOrderLifecycleRecord[]): void {
    this.stores.productionOrders = records.map((r) =>
      withPersistenceMetadata(r, 'kepler-default', r.revision ?? 1),
    )
  }

  nextProductionOrderCounter(): number {
    this.stores.productionOrderCounter += 1
    return this.stores.productionOrderCounter
  }

  allAsLegacy(): ProductionOrderLifecycleRecord[] {
    return this.stores.productionOrders.filter((o) => !o.deletedAt).map(toLegacy)
  }
}
