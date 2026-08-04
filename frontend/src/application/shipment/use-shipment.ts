import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { shipmentApplicationService } from './shipment.application-service'
import type {
  AddLoadCommand,
  CreateShipmentCommand,
  PostInventoryCommand,
  TransitionShipmentCommand,
  UpdateShipmentLogisticsCommand,
} from './shipment.dto'
import { ShipmentDomainError } from './shipment-command.mapper'

export { ShipmentDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, shipmentId?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.shipment.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.shipment.lists() })
  if (shipmentId) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.shipment.detail(shipmentId) })
  }
}

export function useShipmentDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.shipment.dashboard(),
    queryFn: () => shipmentApplicationService.query.dashboard(),
  })
}

export function useShipments() {
  return useQuery({
    queryKey: applicationQueryKeys.shipment.lists(),
    queryFn: () => shipmentApplicationService.query.lists(),
  })
}

export function useShipmentDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.shipment.detail(id),
    queryFn: () => shipmentApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useCreateShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreateShipmentCommand) => shipmentApplicationService.command.create(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useUpdateShipmentLogisticsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: UpdateShipmentLogisticsCommand) =>
      shipmentApplicationService.command.updateLogistics(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useAddShipmentLoadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AddLoadCommand) => shipmentApplicationService.command.addLoad(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useTransitionShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: TransitionShipmentCommand) =>
      shipmentApplicationService.command.transition(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function usePostShipmentInventoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PostInventoryCommand) =>
      shipmentApplicationService.command.postInventory(c),
    onSuccess: (s) => {
      invalidate(qc, s.id)
      void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.movements() })
      void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.balances() })
    },
  })
}

export function newShipmentIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
