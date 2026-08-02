/**
 * Product Card Application Service — UI tek giriş noktası
 * Domain servislerini orchestrate eder; business logic içermez.
 */
import { mapProductCardDetail, mapProductCardKpis, mapProductCardList } from './product-card.mapper'
import type { ProductCardDetailDto, ProductCardKpisDto, ProductCardListItemDto } from './product-card.dto'

export const productCardApplicationService = {
  getList(): ProductCardListItemDto[] {
    return mapProductCardList()
  },

  getDetail(id: string): ProductCardDetailDto | null {
    return mapProductCardDetail(id)
  },

  getKpis(): ProductCardKpisDto {
    return mapProductCardKpis()
  },
}
