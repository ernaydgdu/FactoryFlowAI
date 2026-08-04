import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { mrpApplicationService } from './mrp.application-service'
import type { MrpLifecycleCommand, MrpReleaseCommand, RunMrpCommand } from './mrp-command.mapper'
import { MrpDomainError } from './mrp-command.mapper'

export { MrpDomainError }

function invalidateMrpQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.mrp.all })
}

export function useMrpDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.mrp.dashboard(),
    queryFn: () => mrpApplicationService.query.dashboard(),
  })
}

export function useMrpList() {
  return useQuery({
    queryKey: applicationQueryKeys.mrp.list(),
    queryFn: () => mrpApplicationService.query.list(),
  })
}

export function useMrpKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.mrp.kpis(),
    queryFn: () => mrpApplicationService.query.kpis(),
  })
}

export function useMrpShortages() {
  return useQuery({
    queryKey: applicationQueryKeys.mrp.shortages(),
    queryFn: () => mrpApplicationService.query.shortages(),
  })
}

export function useRunMrpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: RunMrpCommand) => mrpApplicationService.command.run(command),
    onSuccess: () => invalidateMrpQueries(queryClient),
  })
}

export function useRegenerateMrpMutation(mrpRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<MrpLifecycleCommand, 'mrpRunId'>) =>
      mrpApplicationService.command.regenerate({ ...command, mrpRunId }),
    onSuccess: () => invalidateMrpQueries(queryClient),
  })
}

export function useApproveMrpMutation(mrpRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<MrpLifecycleCommand, 'mrpRunId'>) =>
      mrpApplicationService.command.approve({ ...command, mrpRunId }),
    onSuccess: () => invalidateMrpQueries(queryClient),
  })
}

export function useReleasePurchaseSuggestionsMutation(mrpRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<MrpReleaseCommand, 'mrpRunId'>) =>
      mrpApplicationService.command.releasePurchase({ ...command, mrpRunId }),
    onSuccess: () => invalidateMrpQueries(queryClient),
  })
}

export function useReleaseProductionSuggestionsMutation(mrpRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<MrpReleaseCommand, 'mrpRunId'>) =>
      mrpApplicationService.command.releaseProduction({ ...command, mrpRunId }),
    onSuccess: () => invalidateMrpQueries(queryClient),
  })
}
