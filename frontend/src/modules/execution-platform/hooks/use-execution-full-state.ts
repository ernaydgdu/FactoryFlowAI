import { useQuery } from '@tanstack/react-query'

import { executionPlatformApplicationService } from '@/application/execution-platform'

export function useExecutionFullState(productionOrderNo: string) {
  return useQuery({
    queryKey: ['execution-platform', 'full-state', productionOrderNo],
    queryFn: () => executionPlatformApplicationService.queryFullState(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}
