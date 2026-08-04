import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedProductCard } from '@/domain/ports/persistence/persistence-aggregates'
import type { IProductCardRepository } from '@/domain/ports/persistence/aggregates/product-card.repository'
import type { TextileProductCard } from '@/domain/types/textile-erp'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function stripCard(row: PersistedProductCard): TextileProductCard {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...card
  } = row
  return card as TextileProductCard
}

export class ProductCardInMemoryRepository implements IProductCardRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedProductCard | null {
    return (
      this.stores.productCards.find((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedProductCard | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedProductCard | null {
    return this.findByProductCode(tenantId, code)
  }

  findByProductCode(tenantId: string, productCode: string): PersistedProductCard | null {
    return (
      this.stores.productCards.find(
        (c) => c.tenantId === tenantId && c.productCode === productCode && !c.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedProductCard,
    options?: { expectedVersion?: number },
  ): PersistedProductCard {
    const idx = this.stores.productCards.findIndex((c) => c.tenantId === tenantId && c.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.productCards[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('ProductCard', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedProductCard = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.productCards[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.productCards[idx]!.createdAt : now,
    }
    if (idx >= 0) this.stores.productCards[idx] = next
    else this.stores.productCards.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.productCards.findIndex((c) => c.tenantId === tenantId && c.id === id)
    if (idx >= 0) {
      this.stores.productCards[idx] = {
        ...this.stores.productCards[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.productCards.some((c) => c.tenantId === tenantId && c.id === id && !c.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedProductCard> {
    let rows = this.stores.productCards.filter((c) => c.tenantId === tenantId && !c.deletedAt)
    if (typeof filter.status === 'string') {
      rows = rows.filter((c) => c.status === filter.status)
    }
    if (typeof filter.productCode === 'string') {
      rows = rows.filter((c) => c.productCode.includes(filter.productCode as string))
    }
    rows.sort((a, b) => a.productCode.localeCompare(b.productCode))
    return paginate(rows, page)
  }

  cursorByBuyer(tenantId: string, buyerId: string, page: CursorPage): PageResult<PersistedProductCard> {
    const rows = this.stores.productCards.filter(
      (c) => c.tenantId === tenantId && !c.deletedAt && c.refs.buyerId === buyerId,
    )
    return paginate(rows, page)
  }

  listAll(tenantId: string): TextileProductCard[] {
    return this.stores.productCards
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .map(stripCard)
  }

  listApproved(tenantId: string): TextileProductCard[] {
    return this.listAll(tenantId).filter((c) => c.status === 'Approved')
  }
}
