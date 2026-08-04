/**
 * Stock Card seed bootstrap — domain/data/stock-cards.ts yalnızca seed kaynağı.
 */
import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { generateSeedStockCards } from '@/domain/data/stock-cards'
import type { PersistedStockCard } from '@/domain/ports/persistence/persistence-aggregates'

import { inMemoryStoreRegistry } from './store-registry'

let seeded = false

export function ensureStockCardsSeeded(): void {
  if (seeded || inMemoryStoreRegistry.stockCards.length > 0) {
    seeded = true
    return
  }

  const cards = generateSeedStockCards()
  const now = new Date().toISOString()

  inMemoryStoreRegistry.stockCards = cards.map((card): PersistedStockCard => ({
    ...card,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }))

  seeded = true
}

export function resetStockCardSeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.stockCards = []
}
