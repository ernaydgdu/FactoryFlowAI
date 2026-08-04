import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedGoodsReceipt } from '@/domain/ports/persistence/persistence-aggregates'
import type { IGoodsReceiptRepository } from '@/domain/ports/persistence/aggregates/goods-receipt.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class GoodsReceiptInMemoryRepository implements IGoodsReceiptRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedGoodsReceipt | null {
    return (
      this.stores.goodsReceipts.find((g) => g.tenantId === tenantId && g.id === id && !g.deletedAt) ??
      null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedGoodsReceipt | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedGoodsReceipt | null {
    return this.findByGrNo(tenantId, code)
  }

  findByGrNo(tenantId: string, grNo: string): PersistedGoodsReceipt | null {
    return (
      this.stores.goodsReceipts.find(
        (g) => g.tenantId === tenantId && g.grNo === grNo && !g.deletedAt,
      ) ?? null
    )
  }

  findByPurchaseOrderId(tenantId: string, purchaseOrderId: string): PersistedGoodsReceipt[] {
    return this.stores.goodsReceipts.filter(
      (g) => g.tenantId === tenantId && g.purchaseOrderId === purchaseOrderId && !g.deletedAt,
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedGoodsReceipt,
    options?: { expectedVersion?: number },
  ): PersistedGoodsReceipt {
    const idx = this.stores.goodsReceipts.findIndex(
      (g) => g.tenantId === tenantId && g.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.goodsReceipts[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('GoodsReceipt', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedGoodsReceipt = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.goodsReceipts[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.goodsReceipts[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.goodsReceipts[idx] = next
    else this.stores.goodsReceipts.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.goodsReceipts.findIndex((g) => g.tenantId === tenantId && g.id === id)
    if (idx >= 0) {
      this.stores.goodsReceipts[idx] = {
        ...this.stores.goodsReceipts[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.goodsReceipts.some(
      (g) => g.tenantId === tenantId && g.id === id && !g.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedGoodsReceipt> {
    const rows = this.stores.goodsReceipts
      .filter((g) => g.tenantId === tenantId && !g.deletedAt)
      .sort((a, b) => b.grNo.localeCompare(a.grNo))
    return paginate(rows, page)
  }
}
