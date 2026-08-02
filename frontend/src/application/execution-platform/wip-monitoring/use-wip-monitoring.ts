import { useQuery } from '@tanstack/react-query'

import { wipMonitoringApplicationService } from './wip-monitoring.application-service'

const keys = {
  all: ['execution-platform', 'wip'] as const,
  view: (po: string) => [...keys.all, 'view', po] as const,
  positions: (po: string) => [...keys.all, 'positions', po] as const,
  transfers: (po: string) => [...keys.all, 'transfers', po] as const,
  global: () => [...keys.all, 'global'] as const,
}

export function useWipMonitoring(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.view(productionOrderNo),
    queryFn: () => wipMonitoringApplicationService.query.getView(productionOrderNo),
    enabled: !!productionOrderNo,
    staleTime: 15_000,
  })
}

export function useWipPositions(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.positions(productionOrderNo),
    queryFn: () => wipMonitoringApplicationService.query.getPositions(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useWipTransfers(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.transfers(productionOrderNo),
    queryFn: () => wipMonitoringApplicationService.query.getTransfers(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useGlobalWipDensity() {
  return useQuery({
    queryKey: keys.global(),
    queryFn: wipMonitoringApplicationService.query.getGlobalDensity,
    staleTime: 30_000,
  })
}

export { keys as wipMonitoringQueryKeys }
