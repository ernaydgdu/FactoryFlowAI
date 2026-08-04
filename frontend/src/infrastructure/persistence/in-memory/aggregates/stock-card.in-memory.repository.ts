import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedStockCard } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockCardRepository } from '@/domain/ports/persistence/aggregates/stock-card.repository'
import type { StockCard } from '@/domain/types'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function stripStockCard(row: PersistedStockCard): StockCard {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...card
  } = row
  return card as StockCard
}

export class StockCardInMemoryRepository implements IStockCardRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedStockCard | null {
    return (
      this.stores.stockCards.find((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedStockCard | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedStockCard | null {
    return (
      this.stores.stockCards.find(
        (c) => c.tenantId === tenantId && c.code === code && !c.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedStockCard,
    options?: { expectedVersion?: number },
  ): PersistedStockCard {
    const idx = this.stores.stockCards.findIndex((c) => c.tenantId === tenantId && c.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.stockCards[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('StockCard', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedStockCard = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.stockCards[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.stockCards[idx]!.createdAt : now,
    }
    if (idx >= 0) this.stores.stockCards[idx] = next
    else this.stores.stockCards.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.stockCards.findIndex((c) => c.tenantId === tenantId && c.id === id)
    if (idx >= 0) {
      this.stores.stockCards[idx] = {
        ...this.stores.stockCards[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.stockCards.some((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedStockCard> {
    let rows = this.stores.stockCards.filter((c) => c.tenantId === tenantId && !c.deletedAt)
    if (typeof filter.category === 'string') {
      rows = rows.filter((c) => c.category === filter.category)
    }
    rows.sort((a, b) => a.code.localeCompare(b.code))
    return paginate(rows, page)
  }

  listAll(tenantId: string): StockCard[] {
    return this.stores.stockCards
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .map(stripStockCard)
  }
}
