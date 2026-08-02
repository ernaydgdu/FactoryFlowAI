import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { fabricCardApplicationService } from './fabric-card.application-service'

export function useFabricCardList() {
  return useQuery({ queryKey: applicationQueryKeys.fabricCard.list(), queryFn: fabricCardApplicationService.getList })
}

export function useFabricCardKpis() {
  return useQuery({ queryKey: applicationQueryKeys.fabricCard.kpis(), queryFn: fabricCardApplicationService.getKpis })
}

export function useFabricStock() {
  return useQuery({ queryKey: applicationQueryKeys.fabricCard.stock(), queryFn: fabricCardApplicationService.getStock })
}

export function useFabricMovements() {
  return useQuery({ queryKey: applicationQueryKeys.fabricCard.movements(), queryFn: fabricCardApplicationService.getMovements })
}
