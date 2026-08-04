import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { costClosingApplicationService } from './cost-closing.application-service'
import type {
  ApproveCostClosingCommand,
  CostClosingTransitionCommand,
  CreateCostClosingCommand,
} from './cost-closing.dto'
import { CostClosingDomainError } from './cost-closing-command.mapper'

export { CostClosingDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.costClosing.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.costClosing.lists() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.costClosing.history() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.costClosing.brain() })
  if (id) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.costClosing.detail(id) })
  }
}

export function useCostClosingDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.costClosing.dashboard(),
    queryFn: () => costClosingApplicationService.query.dashboard(),
  })
}

export function useCostClosings() {
  return useQuery({
    queryKey: applicationQueryKeys.costClosing.lists(),
    queryFn: () => costClosingApplicationService.query.lists(),
  })
}

export function useCostClosingDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.costClosing.detail(id),
    queryFn: () => costClosingApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useCostClosingHistory() {
  return useQuery({
    queryKey: applicationQueryKeys.costClosing.history(),
    queryFn: () => costClosingApplicationService.query.history(),
  })
}

export function useCostClosingBrain() {
  return useQuery({
    queryKey: applicationQueryKeys.costClosing.brain(),
    queryFn: () => costClosingApplicationService.query.brain(),
  })
}

export function useCreateCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreateCostClosingCommand) =>
      costClosingApplicationService.command.create(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useCalculateCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CostClosingTransitionCommand) =>
      costClosingApplicationService.command.calculate(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useReconcileCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CostClosingTransitionCommand) =>
      costClosingApplicationService.command.reconcile(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useSubmitCostClosingApprovalMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CostClosingTransitionCommand) =>
      costClosingApplicationService.command.submitApproval(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useApproveCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ApproveCostClosingCommand) =>
      costClosingApplicationService.command.approve(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useCloseCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CostClosingTransitionCommand) =>
      costClosingApplicationService.command.close(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useReverseCostClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CostClosingTransitionCommand) =>
      costClosingApplicationService.command.reverse(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function newCostClosingIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
