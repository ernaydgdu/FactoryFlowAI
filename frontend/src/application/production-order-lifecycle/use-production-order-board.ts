import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import {
  executeReleaseMaterialReservation,
  executeReserveMaterials,
  MaterialReservationError,
  type ReserveMaterialsCommand,
} from './production-order-board-command.mapper'
import {
  mapMaterialReservation,
  mapMergePlan,
  mapOperationList,
  mapSplitPlan,
  mapStatusBoard,
} from './production-order-board.mapper'

export { MaterialReservationError, mapMergePlan, mapSplitPlan }

const pobKeys = {
  all: ['production-order-board'] as const,
  statusBoard: () => [...pobKeys.all, 'status-board'] as const,
  operations: () => [...pobKeys.all, 'operations'] as const,
  reservation: (no: string) => [...pobKeys.all, 'reservation', no] as const,
}

function invalidateBoardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: pobKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['production-order-lifecycle'] })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.warehouseManagement.all })
}

export function useProductionOrderStatusBoard() {
  return useQuery({
    queryKey: pobKeys.statusBoard(),
    queryFn: () => mapStatusBoard(),
  })
}

export function useProductionOrderOperationList() {
  return useQuery({
    queryKey: pobKeys.operations(),
    queryFn: () => mapOperationList(),
  })
}

export function useMaterialReservationView(productionOrderNo: string) {
  return useQuery({
    queryKey: pobKeys.reservation(productionOrderNo),
    queryFn: () => mapMaterialReservation(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useReserveMaterialsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReserveMaterialsCommand) => executeReserveMaterials(command),
    onSuccess: () => invalidateBoardQueries(queryClient),
  })
}

export function useReleaseMaterialReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReserveMaterialsCommand) => executeReleaseMaterialReservation(command),
    onSuccess: () => invalidateBoardQueries(queryClient),
  })
}
