import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dailyProductionEntryApplicationService } from './daily-production-entry.application-service'
import type { PostDailyEntryCommand } from './daily-production-entry.dto'

const keys = {
  all: ['execution-platform', 'daily-entry'] as const,
  list: (po: string) => [...keys.all, po] as const,
}

export function useDailyProductionEntries(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.list(productionOrderNo),
    queryFn: () => dailyProductionEntryApplicationService.query.getEntries(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function usePostDailyProductionEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PostDailyEntryCommand) =>
      dailyProductionEntryApplicationService.command.post(input),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: keys.list(vars.productionOrderNo) })
      void qc.invalidateQueries({ queryKey: ['execution-platform'] })
    },
  })
}

export { keys as dailyProductionEntryQueryKeys }
