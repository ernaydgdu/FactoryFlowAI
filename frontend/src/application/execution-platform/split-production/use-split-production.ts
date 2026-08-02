import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { splitProductionApplicationService } from './split-production.application-service'
import type { ExecuteSplitProductionCommand } from './split-production.dto'

const keys = {
  root: ['execution-platform', 'split'] as const,
  view: (po: string) => [...keys.root, 'view', po] as const,
  allSplits: () => [...keys.root, 'all'] as const,
}

export function useSplitProductionView(parentProductionOrderNo: string) {
  return useQuery({
    queryKey: keys.view(parentProductionOrderNo),
    queryFn: () => splitProductionApplicationService.query.getView(parentProductionOrderNo),
    enabled: !!parentProductionOrderNo,
  })
}

export function useAllSplitExecutions() {
  return useQuery({
    queryKey: keys.allSplits(),
    queryFn: splitProductionApplicationService.query.getAll,
  })
}

export function useExecuteSplitProduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ExecuteSplitProductionCommand) =>
      splitProductionApplicationService.command.execute(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.view(vars.parentProductionOrderNo) })
      void qc.invalidateQueries({ queryKey: ['execution-platform'] })
    },
  })
}

export { keys as splitProductionQueryKeys }
