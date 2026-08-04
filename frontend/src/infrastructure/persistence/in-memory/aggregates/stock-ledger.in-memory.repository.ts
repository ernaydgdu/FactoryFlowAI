import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedStockLedger } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockLedgerRepository } from '@/domain/ports/persistence/aggregates/stock-ledger.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class StockLedgerInMemoryRepository implements IStockLedgerRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedStockLedger | null {
    return (
      this.stores.stockLedgers.find((l) => l.tenantId === tenantId && l.id === id && !l.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedStockLedger | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedStockLedger | null {
    return this.findByWarehouseCode(tenantId, code)
  }

  findByWarehouseCode(tenantId: string, warehouseCode: string): PersistedStockLedger | null {
    return (
      this.stores.stockLedgers.find(
        (l) => l.tenantId === tenantId && l.warehouseCode === warehouseCode && !l.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedStockLedger,
    options?: { expectedVersion?: number },
  ): PersistedStockLedger {
    const idx = this.stores.stockLedgers.findIndex(
      (l) => l.tenantId === tenantId && l.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.stockLedgers[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('StockLedger', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedStockLedger = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.stockLedgers[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.stockLedgers[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.stockLedgers[idx] = next
    else {
      this.stores.stockLedgerCounter += 1
      this.stores.stockLedgers.push(next)
    }
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.stockLedgers.findIndex((l) => l.tenantId === tenantId && l.id === id)
    if (idx >= 0) {
      this.stores.stockLedgers[idx] = {
        ...this.stores.stockLedgers[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.stockLedgers.some(
      (l) => l.tenantId === tenantId && l.id === id && !l.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedStockLedger> {
    const rows = this.stores.stockLedgers
      .filter((l) => l.tenantId === tenantId && !l.deletedAt)
      .sort((a, b) => a.warehouseCode.localeCompare(b.warehouseCode))
    return paginate(rows, page)
  }
}
