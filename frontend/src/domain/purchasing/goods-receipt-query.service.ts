import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedGoodsReceipt } from '@/domain/ports/persistence/persistence-aggregates'
import type { IGoodsReceiptRepository } from '@/domain/ports/persistence/aggregates/goods-receipt.repository'
import type { GoodsReceipt } from '@/domain/purchasing/purchasing.types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function repo(): IGoodsReceiptRepository {
  return requireUnitOfWork().goodsReceipts
}

function strip(row: PersistedGoodsReceipt): GoodsReceipt {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...gr
  } = row
  return gr as GoodsReceipt
}

export function queryAllGoodsReceipts(): GoodsReceipt[] {
  return repo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
    .items.map(strip)
}

export function queryGoodsReceiptsByPoId(purchaseOrderId: string): GoodsReceipt[] {
  return repo()
    .findByPurchaseOrderId(DEFAULT_TENANT_ID, purchaseOrderId)
    .map(strip)
}
