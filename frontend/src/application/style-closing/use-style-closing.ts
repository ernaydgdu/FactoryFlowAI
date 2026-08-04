import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { styleClosingApplicationService } from './style-closing.application-service'
import type {
  ApproveStyleClosingCommand,
  CreateStyleClosingCommand,
  StyleClosingTransitionCommand,
} from './style-closing.dto'
import { StyleClosingDomainError } from './style-closing-command.mapper'

export { StyleClosingDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.lists() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.history() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.brain() })
  if (id) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.detail(id) })
  }
}

export function useStyleClosingDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.styleClosing.dashboard(),
    queryFn: () => styleClosingApplicationService.query.dashboard(),
  })
}

export function useStyleClosings() {
  return useQuery({
    queryKey: applicationQueryKeys.styleClosing.lists(),
    queryFn: () => styleClosingApplicationService.query.lists(),
  })
}

export function useStyleClosingDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.styleClosing.detail(id),
    queryFn: () => styleClosingApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useStyleClosingHistory() {
  return useQuery({
    queryKey: applicationQueryKeys.styleClosing.history(),
    queryFn: () => styleClosingApplicationService.query.history(),
  })
}

export function useStyleClosingBrain() {
  return useQuery({
    queryKey: applicationQueryKeys.styleClosing.brain(),
    queryFn: () => styleClosingApplicationService.query.brain(),
  })
}

export function useCreateStyleClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreateStyleClosingCommand) =>
      styleClosingApplicationService.command.create(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useCheckStyleClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: StyleClosingTransitionCommand) =>
      styleClosingApplicationService.command.check(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useSubmitStyleClosingApprovalMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: StyleClosingTransitionCommand) =>
      styleClosingApplicationService.command.submitApproval(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useApproveStyleClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ApproveStyleClosingCommand) =>
      styleClosingApplicationService.command.approve(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function useCloseStyleClosingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: StyleClosingTransitionCommand) =>
      styleClosingApplicationService.command.close(c),
    onSuccess: (r) => invalidate(qc, r.id),
  })
}

export function newStyleClosingIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
