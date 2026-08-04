import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { purchasingApplicationService } from './purchasing.application-service'
import type {
  CreatePurchaseOrderCommand,
  CreatePurchaseOrderRevisionCommand,
  CreatePurchaseRequestCommand,
  CreateRfqCommand,
  PurchaseOrderLifecycleCommand,
  SelectQuotationCommand,
} from './purchasing-command.mapper'
import { PurchaseOrderDomainError, PurchaseRequestDomainError, RfqDomainError } from './purchasing-command.mapper'

export { PurchaseOrderDomainError, PurchaseRequestDomainError, RfqDomainError }

function invalidatePurchasingQueries(queryClient: ReturnType<typeof useQueryClient>, poId?: string) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.dashboard() })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.kpis() })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.purchaseRequests() })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.purchaseOrders() })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.rfqs() })
  if (poId) {
    void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.purchasing.purchaseOrderDetail(poId) })
  }
}

export function usePurchasingDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.dashboard(),
    queryFn: () => purchasingApplicationService.query.dashboard(),
  })
}

export function usePurchasingKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.kpis(),
    queryFn: () => purchasingApplicationService.query.kpis(),
  })
}

export function usePurchaseRequestList() {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.purchaseRequests(),
    queryFn: () => purchasingApplicationService.query.purchaseRequests(),
  })
}

export function usePurchaseOrderList() {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.purchaseOrders(),
    queryFn: () => purchasingApplicationService.query.purchaseOrders(),
  })
}

export function usePurchaseOrderDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.purchaseOrderDetail(id),
    queryFn: () => purchasingApplicationService.query.purchaseOrderDetail(id),
    enabled: !!id,
  })
}

export function useRfqList() {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.rfqs(),
    queryFn: () => purchasingApplicationService.query.rfqs(),
  })
}

export function useQuotationCompare(rfqId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.purchasing.quotationCompare(rfqId),
    queryFn: () => purchasingApplicationService.query.quotationCompare(rfqId),
    enabled: !!rfqId,
  })
}

export function useCreatePurchaseRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreatePurchaseRequestCommand) =>
      purchasingApplicationService.command.createPurchaseRequest(command),
    onSuccess: () => invalidatePurchasingQueries(queryClient),
  })
}

export function useCreateRfqMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateRfqCommand) => purchasingApplicationService.command.createRfq(command),
    onSuccess: () => invalidatePurchasingQueries(queryClient),
  })
}

export function useCreatePurchaseOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreatePurchaseOrderCommand) =>
      purchasingApplicationService.command.createPurchaseOrder(command),
    onSuccess: (result) => invalidatePurchasingQueries(queryClient, result.entityId),
  })
}

export function useApprovePurchaseOrderMutation(purchaseOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<PurchaseOrderLifecycleCommand, 'purchaseOrderId'>) =>
      purchasingApplicationService.command.approvePurchaseOrder({ ...command, purchaseOrderId }),
    onSuccess: () => invalidatePurchasingQueries(queryClient, purchaseOrderId),
  })
}

export function useClosePurchaseOrderMutation(purchaseOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<PurchaseOrderLifecycleCommand, 'purchaseOrderId'>) =>
      purchasingApplicationService.command.closePurchaseOrder({ ...command, purchaseOrderId }),
    onSuccess: () => invalidatePurchasingQueries(queryClient, purchaseOrderId),
  })
}

export function useCancelPurchaseOrderMutation(purchaseOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<PurchaseOrderLifecycleCommand, 'purchaseOrderId'>) =>
      purchasingApplicationService.command.cancelPurchaseOrder({ ...command, purchaseOrderId }),
    onSuccess: () => invalidatePurchasingQueries(queryClient, purchaseOrderId),
  })
}

export function useArchivePurchaseOrderMutation(purchaseOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<PurchaseOrderLifecycleCommand, 'purchaseOrderId'>) =>
      purchasingApplicationService.command.archivePurchaseOrder({ ...command, purchaseOrderId }),
    onSuccess: () => invalidatePurchasingQueries(queryClient, purchaseOrderId),
  })
}

export function useCreatePurchaseOrderRevisionMutation(purchaseOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreatePurchaseOrderRevisionCommand, 'purchaseOrderId'>) =>
      purchasingApplicationService.command.createPurchaseOrderRevision({ ...command, purchaseOrderId }),
    onSuccess: () => invalidatePurchasingQueries(queryClient, purchaseOrderId),
  })
}

export function useSelectQuotationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: SelectQuotationCommand) =>
      purchasingApplicationService.command.selectQuotation(command),
    onSuccess: () => invalidatePurchasingQueries(queryClient),
  })
}
