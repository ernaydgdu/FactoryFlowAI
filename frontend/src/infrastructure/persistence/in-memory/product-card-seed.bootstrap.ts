/**
 * Product Card seed bootstrap — domain/data/products.ts yalnızca seed kaynağı.
 */
import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { buildAllTextileProductCards } from '@/domain/services/textile/product-card-service'
import { sizeSetRepository } from '@/domain/master-data'
import type { PersistedProductCard } from '@/domain/ports/persistence/persistence-aggregates'

import { inMemoryStoreRegistry } from './store-registry'

let seeded = false

export function ensureProductCardsSeeded(): void {
  if (seeded || inMemoryStoreRegistry.productCards.length > 0) {
    seeded = true
    return
  }

  const sizeSetIds = sizeSetRepository.getActive().map((s) => s.id)
  const cards = buildAllTextileProductCards(sizeSetIds)
  const now = new Date().toISOString()

  inMemoryStoreRegistry.productCards = cards.map((card): PersistedProductCard => ({
    ...card,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }))

  inMemoryStoreRegistry.productCardCounter = cards.length
  seeded = true
}

export function resetProductCardSeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.productCards = []
  inMemoryStoreRegistry.productCardCounter = 0
}
