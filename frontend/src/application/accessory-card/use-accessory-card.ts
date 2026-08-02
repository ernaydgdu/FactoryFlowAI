import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { accessoryCardApplicationService } from './accessory-card.application-service'

export function useAccessoryCardList() {
  return useQuery({ queryKey: applicationQueryKeys.accessoryCard.list(), queryFn: accessoryCardApplicationService.getList })
}

export function useAccessoryCardKpis() {
  return useQuery({ queryKey: applicationQueryKeys.accessoryCard.kpis(), queryFn: accessoryCardApplicationService.getKpis })
}

export function useAccessoryStock() {
  return useQuery({ queryKey: applicationQueryKeys.accessoryCard.stock(), queryFn: accessoryCardApplicationService.getStock })
}
