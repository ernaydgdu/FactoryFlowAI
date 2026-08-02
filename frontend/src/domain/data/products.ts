import type { ProductCard } from '../types'
import { sizeSetRepository, supplierRepository } from '../master-data'
import { buildTextileProductCard, toLegacyProductCard } from '../services/textile/product-card-service'

const SIZE_SET_IDS = sizeSetRepository.getActive().map((s) => s.id)

export const TEXTILE_PRODUCT_CARDS = Array.from({ length: 24 }, (_, i) =>
  buildTextileProductCard(i, SIZE_SET_IDS[i % SIZE_SET_IDS.length]),
)

export const PRODUCT_CARDS: ProductCard[] = TEXTILE_PRODUCT_CARDS.map(toLegacyProductCard)

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
