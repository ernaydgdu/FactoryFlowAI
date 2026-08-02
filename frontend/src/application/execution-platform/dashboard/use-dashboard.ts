import { useQuery } from '@tanstack/react-query'

import { executionDashboardApplicationService } from './dashboard.application-service'

const keys = {
  all: ['execution-platform', 'dashboard'] as const,
  dashboard: () => [...keys.all, 'summary'] as const,
  contexts: () => [...keys.all, 'contexts'] as const,
  context: (no: string) => [...keys.all, 'context', no] as const,
}

export function useExecutionDashboard() {
  return useQuery({
    queryKey: keys.dashboard(),
    queryFn: executionDashboardApplicationService.query.getDashboard,
    staleTime: 30_000,
  })
}

export function useExecutionContextList() {
  return useQuery({
    queryKey: keys.contexts(),
    queryFn: executionDashboardApplicationService.query.getContextList,
  })
}

export function useExecutionContext(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.context(productionOrderNo),
    queryFn: () => executionDashboardApplicationService.query.getContext(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export { keys as executionDashboardQueryKeys }
