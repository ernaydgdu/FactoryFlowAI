import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { warehouseManagementApplicationService } from './warehouse-management.application-service'
import type { FinishedGoodsReceiptCommand } from './warehouse-management-command.mapper'
import { InventoryDomainError } from './warehouse-management-command.mapper'

export { InventoryDomainError }

function invalidateWarehouseManagementQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.warehouseManagement.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.warehouse.all })
}

export function useWarehouseSummaryList() {
  return useQuery({
    queryKey: applicationQueryKeys.warehouseManagement.summaryList(),
    queryFn: () => warehouseManagementApplicationService.query.summaryList(),
  })
}

export function useWarehouseDetail(warehouseCode: string) {
  return useQuery({
    queryKey: applicationQueryKeys.warehouseManagement.detail(warehouseCode),
    queryFn: () => warehouseManagementApplicationService.query.detail(warehouseCode),
    enabled: !!warehouseCode,
  })
}

export function useFinishedGoodsWarehouseOptions() {
  return useQuery({
    queryKey: applicationQueryKeys.warehouseManagement.finishedGoodsWarehouses(),
    queryFn: () => warehouseManagementApplicationService.query.finishedGoodsWarehouses(),
  })
}

export function useFinishedGoodsReceiptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: FinishedGoodsReceiptCommand) =>
      warehouseManagementApplicationService.command.finishedGoodsReceipt(command),
    onSuccess: () => invalidateWarehouseManagementQueries(queryClient),
  })
}
