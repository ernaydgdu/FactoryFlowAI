import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { warehouseApplicationService } from './warehouse.application-service'

export function useWarehouseHierarchy() {
  return useQuery({ queryKey: applicationQueryKeys.warehouse.hierarchy(), queryFn: warehouseApplicationService.getHierarchy })
}

export function useWarehouseInbound() {
  return useQuery({ queryKey: applicationQueryKeys.warehouse.inbound(), queryFn: warehouseApplicationService.getInbound })
}

export function useWarehouseOutbound() {
  return useQuery({ queryKey: applicationQueryKeys.warehouse.outbound(), queryFn: warehouseApplicationService.getOutbound })
}

export function useWarehouseCount() {
  return useQuery({ queryKey: applicationQueryKeys.warehouse.count(), queryFn: warehouseApplicationService.getCount })
}

export function useWarehouseKpis() {
  return useQuery({ queryKey: [...applicationQueryKeys.warehouse.all, 'kpis'], queryFn: warehouseApplicationService.getKpis })
}
