import { useMutation, useQueryClient } from '@tanstack/react-query'

import { executionDemoDevApplicationService } from './execution-demo.application-service'
import type { InitializeDemoExecutionDataCommand } from './execution-demo.mapper'

export function useInitializeDemoExecutionData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InitializeDemoExecutionDataCommand) =>
      executionDemoDevApplicationService.command.initializeDemoData(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['execution-platform'] })
      void qc.invalidateQueries({ queryKey: ['production-order-lifecycle'] })
    },
  })
}
