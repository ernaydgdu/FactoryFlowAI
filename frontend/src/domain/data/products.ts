/**
 * Product Card seed data — runtime okuma repository üzerinden yapılır.
 * @see domain/product-card/product-card-crud.service.ts
 */
import type { ProductCard } from '../types'
import type { TextileProductCard } from '../types/textile-erp'
import { buildTextileProductCard, toLegacyProductCard } from '../services/textile/product-card-service'
import {
  queryAllProductCards,
  queryProductCardByCode,
  queryProductCardById,
} from '../product-card/product-card-crud.service'
import { sizeSetRepository, supplierRepository } from '../master-data'

/** Seed generator — yalnızca bootstrap tarafından kullanılır */
export function generateSeedTextileProductCards(): TextileProductCard[] {
  const sizeSetIds = sizeSetRepository.getActive().map((s) => s.id)
  return Array.from({ length: 24 }, (_, i) =>
    buildTextileProductCard(i, sizeSetIds[i % sizeSetIds.length]),
  )
}

function asArrayProxy<T>(getter: () => T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const arr = getter()
      const value = Reflect.get(arr, prop, arr)
      return typeof value === 'function' ? value.bind(arr) : value
    },
  })
}

/** @deprecated Runtime için queryAllProductCards kullanın */
export const TEXTILE_PRODUCT_CARDS = asArrayProxy(() => queryAllProductCards())

/** @deprecated Runtime için getProductCardsArray kullanın */
export const PRODUCT_CARDS = asArrayProxy(() =>
  queryAllProductCards().map(toLegacyProductCard),
)

export function getProductCardsArray(): ProductCard[] {
  return queryAllProductCards().map(toLegacyProductCard)
}

export function getProductById(id: string): ProductCard | undefined {
  const card = queryProductCardById(id)
  return card ? toLegacyProductCard(card) : undefined
}

export function getTextileProductById(id: string) {
  return queryProductCardById(id) ?? undefined
}

export function getProductByCode(code: string): ProductCard | undefined {
  const card = queryProductCardByCode(code)
  return card ? toLegacyProductCard(card) : undefined
}

export function getSupplierForStockCard(stockCardSupplierCode: string): string {
  return supplierRepository.getByCode(stockCardSupplierCode)?.name ?? stockCardSupplierCode
}
