import { useQuery } from '@tanstack/react-query'

import { executionBrainApplicationService } from './execution-brain.application-service'

const keys = {
  all: ['execution-platform', 'brain'] as const,
  view: (po: string) => [...keys.all, 'view', po] as const,
  insight: (po: string) => [...keys.all, 'insight', po] as const,
  summary: () => [...keys.all, 'summary'] as const,
  metrics: () => [...keys.all, 'metrics'] as const,
}

export function useExecutionBrainView(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.view(productionOrderNo),
    queryFn: () => executionBrainApplicationService.query.getView(productionOrderNo),
    enabled: !!productionOrderNo,
    staleTime: 60_000,
  })
}

export function useExecutionBrainInsight(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.insight(productionOrderNo),
    queryFn: () => executionBrainApplicationService.query.getInsight(productionOrderNo),
    enabled: !!productionOrderNo,
    staleTime: 60_000,
  })
}

export function useExecutionBrainSummary() {
  return useQuery({
    queryKey: keys.summary(),
    queryFn: executionBrainApplicationService.query.getSummary,
    staleTime: 60_000,
  })
}

export function useExecutionBrainMetrics() {
  return useQuery({
    queryKey: keys.metrics(),
    queryFn: executionBrainApplicationService.query.getMetrics,
    staleTime: Infinity,
  })
}

export { keys as executionBrainQueryKeys }
