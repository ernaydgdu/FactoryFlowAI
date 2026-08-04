import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { exportLogisticsApplicationService } from './export-logistics.application-service'
import type {
  AssignContainerCommand,
  ClearCustomsCommand,
  ConfirmBookingCommand,
  CreateExportShipmentCommand,
  TransitionExportShipmentCommand,
} from './export-logistics.dto'
import { ExportLogisticsDomainError } from './export-logistics-command.mapper'

export { ExportLogisticsDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.exportLogistics.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.exportLogistics.lists() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.exportLogistics.brain() })
  if (id) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.exportLogistics.detail(id) })
  }
}

export function useExportLogisticsDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.exportLogistics.dashboard(),
    queryFn: () => exportLogisticsApplicationService.query.dashboard(),
  })
}

export function useExportShipments() {
  return useQuery({
    queryKey: applicationQueryKeys.exportLogistics.lists(),
    queryFn: () => exportLogisticsApplicationService.query.lists(),
  })
}

export function useExportShipmentDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.exportLogistics.detail(id),
    queryFn: () => exportLogisticsApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useExportLogisticsBrain() {
  return useQuery({
    queryKey: applicationQueryKeys.exportLogistics.brain(),
    queryFn: () => exportLogisticsApplicationService.query.brain(),
  })
}

export function useCreateExportShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreateExportShipmentCommand) =>
      exportLogisticsApplicationService.command.create(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useConfirmBookingMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ConfirmBookingCommand) =>
      exportLogisticsApplicationService.command.confirmBooking(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useAssignContainerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AssignContainerCommand) =>
      exportLogisticsApplicationService.command.assignContainer(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useClearCustomsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ClearCustomsCommand) =>
      exportLogisticsApplicationService.command.clearCustoms(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useTransitionExportShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: TransitionExportShipmentCommand) =>
      exportLogisticsApplicationService.command.transition(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function newExportLogisticsIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
