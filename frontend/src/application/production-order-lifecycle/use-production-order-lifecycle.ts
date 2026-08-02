import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productionOrderLifecycleApplicationService } from './production-order-lifecycle.application-service'
import type {
  AddDailyEntryInputDto,
  CreateProductionOrderInputDto,
  TransitionProductionOrderInputDto,
} from './production-order-lifecycle.dto'

const polKeys = {
  all: ['production-order-lifecycle'] as const,
  dashboard: () => [...polKeys.all, 'dashboard'] as const,
  orders: () => [...polKeys.all, 'orders'] as const,
  order: (no: string) => [...polKeys.all, 'order', no] as const,
  daily: () => [...polKeys.all, 'daily'] as const,
  dailyFor: (no: string) => [...polKeys.all, 'daily', no] as const,
  brain: (no: string) => [...polKeys.all, 'brain', no] as const,
  twin: (no: string) => [...polKeys.all, 'twin', no] as const,
  createCandidates: () => [...polKeys.all, 'create-candidates'] as const,
}

export function useProductionOrderLifecycleDashboard() {
  return useQuery({
    queryKey: polKeys.dashboard(),
    queryFn: productionOrderLifecycleApplicationService.getDashboard,
    staleTime: 60_000,
  })
}

export function useProductionOrderLifecycleList() {
  return useQuery({
    queryKey: polKeys.orders(),
    queryFn: productionOrderLifecycleApplicationService.getOrders,
  })
}

export function useProductionOrderLifecycleDetail(productionOrderNo: string) {
  return useQuery({
    queryKey: polKeys.order(productionOrderNo),
    queryFn: () => productionOrderLifecycleApplicationService.getOrderByNo(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useProductionOrderDailyEntries(productionOrderNo?: string) {
  return useQuery({
    queryKey: productionOrderNo ? polKeys.dailyFor(productionOrderNo) : polKeys.daily(),
    queryFn: () =>
      productionOrderNo
        ? productionOrderLifecycleApplicationService.getDailyEntriesForOrder(productionOrderNo)
        : productionOrderLifecycleApplicationService.getDailyEntries(),
  })
}

export function useProductionOrderBrainInsight(productionOrderNo: string) {
  return useQuery({
    queryKey: polKeys.brain(productionOrderNo),
    queryFn: () => productionOrderLifecycleApplicationService.getBrainInsight(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useProductionOrderTwinSimulation(productionOrderNo: string, enabled = false) {
  return useQuery({
    queryKey: polKeys.twin(productionOrderNo),
    queryFn: () => productionOrderLifecycleApplicationService.getTwinSimulation(productionOrderNo),
    enabled: enabled && !!productionOrderNo,
  })
}

export function useSalesOrdersForPoCreate() {
  return useQuery({
    queryKey: polKeys.createCandidates(),
    queryFn: productionOrderLifecycleApplicationService.getSalesOrdersForCreate,
  })
}

export function useCreateProductionOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProductionOrderInputDto) =>
      productionOrderLifecycleApplicationService.createFromSalesOrder(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: polKeys.all })
    },
  })
}

export function useTransitionProductionOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TransitionProductionOrderInputDto) =>
      productionOrderLifecycleApplicationService.transitionStatus(input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: polKeys.all })
      void qc.invalidateQueries({ queryKey: polKeys.order(vars.productionOrderNo) })
    },
  })
}

export function useAddDailyProductionEntryLifecycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddDailyEntryInputDto) =>
      productionOrderLifecycleApplicationService.addDailyEntry(input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: polKeys.all })
      void qc.invalidateQueries({ queryKey: polKeys.order(vars.productionOrderNo) })
    },
  })
}
