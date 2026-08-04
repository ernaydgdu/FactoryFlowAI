import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { salesOrderApplicationService } from './sales-order.application-service'
import type {
  CreateSalesOrderCommand,
  CreateSalesOrderRevisionCommand,
  SalesOrderLifecycleCommand,
  UpdateSalesOrderCommand,
} from './sales-order-command.mapper'
import { SalesOrderDomainError } from './sales-order-command.mapper'

export { SalesOrderDomainError }

function invalidateSalesOrderQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.salesOrder.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.salesOrder.list() })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.salesOrder.kpis() })
  if (id) {
    void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.salesOrder.detail(id) })
  }
}

export function useSalesOrderList() {
  return useQuery({
    queryKey: applicationQueryKeys.salesOrder.list(),
    queryFn: () => salesOrderApplicationService.query.list(),
  })
}

export function useSalesOrderListOrders() {
  return useQuery({
    queryKey: [...applicationQueryKeys.salesOrder.list(), 'table'] as const,
    queryFn: () => salesOrderApplicationService.query.listOrders(),
  })
}

export function useSalesOrderKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.salesOrder.kpis(),
    queryFn: () => salesOrderApplicationService.query.kpis(),
  })
}

export function useSalesOrderDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.salesOrder.detail(id),
    queryFn: () => salesOrderApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useCreateSalesOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateSalesOrderCommand) =>
      salesOrderApplicationService.command.create(command),
    onSuccess: (result) => invalidateSalesOrderQueries(queryClient, result.salesOrderId),
  })
}

export function useUpdateSalesOrderMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<UpdateSalesOrderCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.update({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}

export function useApproveSalesOrderMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<SalesOrderLifecycleCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.approve({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}

export function useCancelSalesOrderMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<SalesOrderLifecycleCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.cancel({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}

export function useCloseSalesOrderMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<SalesOrderLifecycleCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.close({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}

export function useArchiveSalesOrderMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<SalesOrderLifecycleCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.archive({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}

export function useCreateSalesOrderRevisionMutation(salesOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateSalesOrderRevisionCommand, 'salesOrderId'>) =>
      salesOrderApplicationService.command.createRevision({ ...command, salesOrderId }),
    onSuccess: () => invalidateSalesOrderQueries(queryClient, salesOrderId),
  })
}
