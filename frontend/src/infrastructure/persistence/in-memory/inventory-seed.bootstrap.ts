/**
 * Inventory seed — opening balances + GR receipt movements after purchasing seed.
 */
import { warehouseRepository } from '@/domain/master-data'
import { queryAllGoodsReceipts } from '@/domain/purchasing/goods-receipt-query.service'
import { queryAllStockCards } from '@/domain/stock-card/stock-card-query.service'
import { queryStockCardByCode } from '@/domain/stock-card/stock-card-query.service'

import { persistGoodsReceiptToLedger, persistOpeningBalance } from '@/domain/inventory/stock-ledger-crud.service'
import { queryAllStockLedgers } from '@/domain/inventory/stock-ledger-query.service'

import { inMemoryStoreRegistry } from './store-registry'

let seeded = false

export function ensureInventorySeeded(): void {
  if (seeded || queryAllStockLedgers().length > 0) {
    seeded = true
    return
  }

  const warehouses = warehouseRepository.getActive()

  for (const card of queryAllStockCards()) {
    if (card.availableQty <= 0) continue
    const whCode = card.warehouseCode || warehouses[0]?.code
    if (!whCode || !warehouseRepository.getByCode(whCode)) continue
    persistOpeningBalance(card.id, whCode, card.availableQty, 'seed')
  }

  for (const gr of queryAllGoodsReceipts()) {
    if (gr.status !== 'Posted') continue
    if (!warehouseRepository.getByCode(gr.warehouseCode)) continue
    const alreadyPosted = inMemoryStoreRegistry.stockMovements.some(
      (m) => m.referenceId === gr.id && m.type === 'RECEIPT',
    )
    if (alreadyPosted) continue
    persistGoodsReceiptToLedger(
      {
        goodsReceiptId: gr.id,
        grNo: gr.grNo,
        purchaseOrderId: gr.purchaseOrderId,
        poNo: gr.poNo,
        warehouseCode: gr.warehouseCode,
        lines: gr.lines.map((l) => ({
          stockCardId: queryStockCardByCode(l.materialCode)?.id ?? l.materialCode,
          materialCode: l.materialCode,
          quantity: l.quantity,
        })),
      },
      'seed',
    )
  }

  seeded = true
}

export function resetInventorySeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.stockLedgers = []
  inMemoryStoreRegistry.stockLedgerCounter = 0
  inMemoryStoreRegistry.stockMovements = []
  inMemoryStoreRegistry.stockMovementCounter = 0
}
