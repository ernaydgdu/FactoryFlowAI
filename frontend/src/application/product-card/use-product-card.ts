import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { productCardApplicationService } from './product-card.application-service'

export function useProductCardList() {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.list(),
    queryFn: () => productCardApplicationService.getList(),
  })
}

export function useProductCardDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.detail(id),
    queryFn: () => productCardApplicationService.getDetail(id),
    enabled: !!id,
  })
}

export function useProductCardKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.kpis(),
    queryFn: () => productCardApplicationService.getKpis(),
  })
}
