import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { qualityApplicationService } from './quality.application-service'
import type { InspectionCommand } from './quality-command.mapper'
import { QualityDomainError } from './quality-command.mapper'

export { QualityDomainError }

function invalidateQuality(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.quality.all })
  void qc.invalidateQueries({ queryKey: ['execution-platform'] })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.shopFloor.all })
}

export function useQualityDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.quality.dashboard(),
    queryFn: () => qualityApplicationService.query.dashboard(),
  })
}

export function useQualityInspections() {
  return useQuery({
    queryKey: applicationQueryKeys.quality.inspections(),
    queryFn: () => qualityApplicationService.query.inspections(),
  })
}

export function useReworkQueue() {
  return useQuery({
    queryKey: applicationQueryKeys.quality.reworkQueue(),
    queryFn: () => qualityApplicationService.query.reworkQueue(),
  })
}

export function useHoldQueue() {
  return useQuery({
    queryKey: applicationQueryKeys.quality.holdQueue(),
    queryFn: () => qualityApplicationService.query.holdQueue(),
  })
}

export function useQcPlanSteps() {
  return useQuery({
    queryKey: applicationQueryKeys.quality.plan(),
    queryFn: () => qualityApplicationService.query.qcPlanSteps(),
  })
}

export function useNcrDetail(ncrId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.quality.ncrDetail(ncrId),
    queryFn: () => qualityApplicationService.query.ncrDetail(ncrId),
    enabled: !!ncrId,
  })
}

export function useQualityTimeline(productionOrderNo = '') {
  return useQuery({
    queryKey: applicationQueryKeys.quality.timeline(productionOrderNo || 'all'),
    queryFn: () => qualityApplicationService.query.timeline(productionOrderNo || undefined),
  })
}

export function useInspectionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: InspectionCommand & { disposition: NonNullable<InspectionCommand['disposition']> }) =>
      qualityApplicationService.command.inspection(c),
    onSuccess: () => invalidateQuality(qc),
  })
}

export function useAcceptMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: InspectionCommand) => qualityApplicationService.command.accept(c),
    onSuccess: () => invalidateQuality(qc),
  })
}

export function useRejectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: InspectionCommand) => qualityApplicationService.command.reject(c),
    onSuccess: () => invalidateQuality(qc),
  })
}

export function useReworkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: InspectionCommand) => qualityApplicationService.command.rework(c),
    onSuccess: () => invalidateQuality(qc),
  })
}

export function useHoldMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: InspectionCommand) => qualityApplicationService.command.hold(c),
    onSuccess: () => invalidateQuality(qc),
  })
}

export function useCompleteReworkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: {
      productionOrderNo: string
      operationCode: string
      bundleId?: string
      actorUserId: string
    }) => qualityApplicationService.command.completeRework(c),
    onSuccess: () => invalidateQuality(qc),
  })
}
