import { DEMO_STOCK_LEDGER } from '../../data/stock-ledger-demo'
import { validateLedgerIntegrity } from '../../services/stock-ledger'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const stockLedgerAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'STOCK_LEDGER',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const ledger = DEMO_STOCK_LEDGER
    const integrity = validateLedgerIntegrity(ledger)
    const lowStock = ledger.balances.filter((b) => b.available < 100)

    return {
      sourceId: 'STOCK_LEDGER',
      fetchedAt: new Date().toISOString(),
      entityKeys: ledger.balances.map((b) => `${b.stockCardId}:${b.warehouseCode}`),
      summary: `${ledger.movements.length} hareket, ${ledger.balances.length} bakiye, ${lowStock.length} düşük stok`,
      recordCount: ledger.balances.length,
      payload: {
        movementCount: ledger.movements.length,
        balanceCount: ledger.balances.length,
        integrityValid: integrity.valid,
        lowStockItems: lowStock.map((b) => ({
          stockCardId: b.stockCardId,
          warehouseCode: b.warehouseCode,
          availableQty: b.available,
          onHand: b.onHand,
          reserved: b.reserved,
        })),
        note: 'Brain Stock Ledger üzerinde işlem yapmaz',
      },
    }
  },
}
