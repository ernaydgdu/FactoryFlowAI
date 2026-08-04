/**
 * Stock Card query — runtime reads via repository port.
 */
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedStockCard } from '@/domain/ports/persistence/persistence-aggregates'
import type { IStockCardRepository } from '@/domain/ports/persistence/aggregates/stock-card.repository'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { StockCard, StockCardCategory } from '@/domain/types'

function stockCardRepo(): IStockCardRepository {
  return requireUnitOfWork().stockCards
}

function strip(row: PersistedStockCard): StockCard {
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

export function queryAllStockCards(): StockCard[] {
  const page = stockCardRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(strip)
}

export function queryStockCardById(id: string): StockCard | null {
  const row = stockCardRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryStockCardByCode(code: string): StockCard | null {
  const row = stockCardRepo().findByCode(DEFAULT_TENANT_ID, code)
  return row ? strip(row) : null
}

export function queryStockCardsByCategory(category?: StockCardCategory): StockCard[] {
  const all = queryAllStockCards()
  if (!category) return all
  return all.filter((c) => c.category === category)
}
