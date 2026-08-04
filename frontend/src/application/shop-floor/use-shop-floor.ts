import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { shopFloorApplicationService } from './shop-floor.application-service'
import type {
  OperationCommand,
  ProductionDeclarationCommand,
  SessionActionCommand,
  StartSessionCommand,
} from './shop-floor-command.mapper'
import { ShopFloorDomainError } from './shop-floor-command.mapper'

export { ShopFloorDomainError }

function invalidateShopFloor(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.shopFloor.all })
  void queryClient.invalidateQueries({ queryKey: ['execution-platform'] })
  void queryClient.invalidateQueries({ queryKey: ['production-order-lifecycle'] })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.warehouseManagement.all })
}

export function useShopFloorContexts() {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.contexts(),
    queryFn: () => shopFloorApplicationService.query.contexts(),
  })
}

export function useShopFloorOperations(productionOrderNo: string) {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.operations(productionOrderNo),
    queryFn: () => shopFloorApplicationService.query.operationsForOrder(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useShopFloorSessions(productionOrderNo: string) {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.sessions(productionOrderNo),
    queryFn: () => shopFloorApplicationService.query.sessionsForOrder(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useShopFloorMachines() {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.machines(),
    queryFn: () => shopFloorApplicationService.query.machineStatusList(),
  })
}

export function useShopFloorLabor() {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.labor(),
    queryFn: () => shopFloorApplicationService.query.laborTrackingList(),
  })
}

export function useShopFloorProgress() {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.progress(),
    queryFn: () => shopFloorApplicationService.query.operationProgress(),
  })
}

export function useWorkstationView(machineId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.workstation(machineId),
    queryFn: () => shopFloorApplicationService.query.workstationView(machineId),
    enabled: !!machineId,
  })
}

export function useShopFloorOptions() {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.options(),
    queryFn: () => ({
      machines: shopFloorApplicationService.query.machineOptions(),
      operators: shopFloorApplicationService.query.operatorOptions(),
    }),
  })
}

export function useShopFloorBundles(productionOrderNo: string) {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.bundles(productionOrderNo),
    queryFn: () => shopFloorApplicationService.query.bundles(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useShopFloorTimeline(productionOrderNo = '') {
  return useQuery({
    queryKey: applicationQueryKeys.shopFloor.timeline(productionOrderNo || 'all'),
    queryFn: () => shopFloorApplicationService.query.timeline(productionOrderNo || undefined),
  })
}

export function useDeclareProductionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ProductionDeclarationCommand) =>
      shopFloorApplicationService.command.declareProduction(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useCompletionConfirmationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: { productionOrderNo: string; actorUserId: string }) =>
      shopFloorApplicationService.command.completionConfirmation(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useStartOperationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: OperationCommand) => shopFloorApplicationService.command.startOperation(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function usePauseOperationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: OperationCommand) => shopFloorApplicationService.command.pauseOperation(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useResumeOperationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: OperationCommand) => shopFloorApplicationService.command.resumeOperation(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useCompleteOperationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: OperationCommand & { completedQty?: number }) =>
      shopFloorApplicationService.command.completeOperation(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useMoveBundleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: {
      bundleId: string
      toOperationCode: string
      workshopCode: string
      lineId?: string | null
      actorUserId: string
    }) => shopFloorApplicationService.command.moveBundle(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useStartWorkSessionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: StartSessionCommand) =>
      shopFloorApplicationService.command.startWorkSession(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}

export function useFinishWorkSessionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: SessionActionCommand) =>
      shopFloorApplicationService.command.finishWorkSession(c),
    onSuccess: () => invalidateShopFloor(qc),
  })
}
