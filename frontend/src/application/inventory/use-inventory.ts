import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { inventoryApplicationService } from './inventory.application-service'
import type {
  AdjustmentCommand,
  CycleCountCommand,
  GoodsIssueCommand,
  GoodsReceiptCommand,
  ReservationCommand,
  TransferCommand,
} from './inventory-command.mapper'
import { GoodsReceiptDomainError, InventoryDomainError } from './inventory-command.mapper'

export { GoodsReceiptDomainError, InventoryDomainError }

function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.warehouse.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.all })
}

export function useInventoryDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.dashboard(),
    queryFn: () => inventoryApplicationService.query.dashboard(),
  })
}

export function useInventoryKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.kpis(),
    queryFn: () => inventoryApplicationService.query.kpis(),
  })
}

export function useInventoryBalanceList() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.balances(),
    queryFn: () => inventoryApplicationService.query.balances(),
  })
}

export function useInventoryMovementList() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.movements(),
    queryFn: () => inventoryApplicationService.query.movements(),
  })
}

export function useInventoryInbound() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.inbound(),
    queryFn: () => inventoryApplicationService.query.inbound(),
  })
}

export function useInventoryOutbound() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.outbound(),
    queryFn: () => inventoryApplicationService.query.outbound(),
  })
}

export function useInventoryTransfers() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.transfers(),
    queryFn: () => inventoryApplicationService.query.transfers(),
  })
}

export function useInventoryReservations() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.reservations(),
    queryFn: () => inventoryApplicationService.query.reservations(),
  })
}

export function useInventoryCycleCounts() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.cycleCounts(),
    queryFn: () => inventoryApplicationService.query.cycleCounts(),
  })
}

export function useWarehouseList() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.warehouses(),
    queryFn: () => inventoryApplicationService.query.warehouses(),
  })
}

export function useGoodsReceiptList() {
  return useQuery({
    queryKey: applicationQueryKeys.inventory.goodsReceipts(),
    queryFn: () => inventoryApplicationService.query.goodsReceipts(),
  })
}

export function useGoodsReceiptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: GoodsReceiptCommand) =>
      inventoryApplicationService.command.goodsReceipt(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useGoodsIssueMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: GoodsIssueCommand) =>
      inventoryApplicationService.command.goodsIssue(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useTransferMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: TransferCommand) =>
      inventoryApplicationService.command.transfer(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReservationCommand) =>
      inventoryApplicationService.command.reservation(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useReservationReleaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReservationCommand) =>
      inventoryApplicationService.command.reservationRelease(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useAdjustmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: AdjustmentCommand) =>
      inventoryApplicationService.command.adjustment(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}

export function useCycleCountMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CycleCountCommand) =>
      inventoryApplicationService.command.cycleCount(command),
    onSuccess: () => invalidateInventoryQueries(queryClient),
  })
}
