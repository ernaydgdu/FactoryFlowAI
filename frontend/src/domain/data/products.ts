import type { ProductCard } from '../types'
import { sizeSetRepository, supplierRepository } from '../master-data'
import { buildTextileProductCard, toLegacyProductCard } from '../services/textile/product-card-service'
import { lazyArray } from './lazy-cache'

export const TEXTILE_PRODUCT_CARDS = lazyArray(() => {
  const sizeSetIds = sizeSetRepository.getActive().map((s) => s.id)
  return Array.from({ length: 24 }, (_, i) =>
    buildTextileProductCard(i, sizeSetIds[i % sizeSetIds.length]),
  )
})

export const PRODUCT_CARDS = lazyArray((): ProductCard[] => TEXTILE_PRODUCT_CARDS.map(toLegacyProductCard))

export function getProductById(id: string): ProductCard | undefined {
  return PRODUCT_CARDS.find((p) => p.id === id)
}

export function getTextileProductById(id: string) {
  return TEXTILE_PRODUCT_CARDS.find((p) => p.id === id)
}

export function getProductByCode(code: string): ProductCard | undefined {
  return PRODUCT_CARDS.find((p) => p.productCode === code)
}

export function getSupplierForStockCard(stockCardSupplierCode: string): string {
  return supplierRepository.getByCode(stockCardSupplierCode)?.name ?? stockCardSupplierCode
}
