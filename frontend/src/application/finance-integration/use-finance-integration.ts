import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { financeIntegrationApplicationService } from './finance-integration.application-service'
import type {
  CloseFinancialPeriodCommand,
  EnqueueOperationalEventsCommand,
  PostBatchCommand,
  ReverseBatchCommand,
  UpsertGlMappingCommand,
} from './finance-integration.dto'
import { FinanceIntegrationDomainError } from './finance-integration-command.mapper'

export { FinanceIntegrationDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.financeIntegration.all })
  if (id) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.financeIntegration.detail(id) })
  }
}

export function useFinanceDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.dashboard(),
    queryFn: () => financeIntegrationApplicationService.query.dashboard(),
  })
}

export function useFinanceBatches() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.batches(),
    queryFn: () => financeIntegrationApplicationService.query.batches(),
  })
}

export function useFinanceBatchDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.detail(id),
    queryFn: () => financeIntegrationApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useFinanceQueue() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.queue(),
    queryFn: () => financeIntegrationApplicationService.query.queue(),
  })
}

export function useFinanceFailed() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.failed(),
    queryFn: () => financeIntegrationApplicationService.query.failed(),
  })
}

export function useFinanceResults() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.results(),
    queryFn: () => financeIntegrationApplicationService.query.results(),
  })
}

export function useFinanceMappings() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.mappings(),
    queryFn: () => financeIntegrationApplicationService.query.mappings(),
  })
}

export function useFinancePeriods() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.periods(),
    queryFn: () => financeIntegrationApplicationService.query.periods(),
  })
}

export function useFinanceBrain() {
  return useQuery({
    queryKey: applicationQueryKeys.financeIntegration.brain(),
    queryFn: () => financeIntegrationApplicationService.query.brain(),
  })
}

export function useEnqueueFinanceEventsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: EnqueueOperationalEventsCommand) =>
      financeIntegrationApplicationService.command.enqueue(c),
    onSuccess: () => invalidate(qc),
  })
}

export function usePostBatchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PostBatchCommand) => financeIntegrationApplicationService.command.post(c),
    onSuccess: (b) => invalidate(qc, b.id),
  })
}

export function useReverseBatchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ReverseBatchCommand) =>
      financeIntegrationApplicationService.command.reverse(c),
    onSuccess: (b) => invalidate(qc, b.id),
  })
}

export function useUpsertGlMappingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: UpsertGlMappingCommand) =>
      financeIntegrationApplicationService.command.upsertGlMapping(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useCloseFinancialPeriodMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CloseFinancialPeriodCommand) =>
      financeIntegrationApplicationService.command.closePeriod(c),
    onSuccess: () => invalidate(qc),
  })
}

export function newFinanceIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
