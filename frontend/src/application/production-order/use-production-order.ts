import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { productionOrderApplicationService } from './production-order.application-service'

export function useProductionOrderList() {
  return useQuery({ queryKey: applicationQueryKeys.productionOrder.list(), queryFn: productionOrderApplicationService.getList })
}

export function useProductionLines() {
  return useQuery({ queryKey: applicationQueryKeys.productionOrder.lines(), queryFn: productionOrderApplicationService.getLines })
}

export function useProductionOperations() {
  return useQuery({ queryKey: applicationQueryKeys.productionOrder.operations(), queryFn: productionOrderApplicationService.getOperations })
}

export function useProductionKpis() {
  return useQuery({ queryKey: [...applicationQueryKeys.productionOrder.all, 'kpis'], queryFn: productionOrderApplicationService.getKpis })
}
