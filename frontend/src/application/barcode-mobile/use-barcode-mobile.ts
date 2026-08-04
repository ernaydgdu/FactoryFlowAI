import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { barcodeMobileApplicationService } from './barcode-mobile.application-service'
import type { ScanCommand, WorkflowScanCommand } from './barcode-mobile.dto'
import { BarcodeMobileDomainError } from './barcode-mobile-command.mapper'

export { BarcodeMobileDomainError }

function invalidateBarcode(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.barcodeMobile.all })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.shopFloor.all })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.warehouseManagement.all })
}

export function useBarcodeDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.barcodeMobile.dashboard(),
    queryFn: () => barcodeMobileApplicationService.query.dashboard(),
  })
}

export function useOfflineQueue() {
  return useQuery({
    queryKey: applicationQueryKeys.barcodeMobile.offlineQueue(),
    queryFn: () => barcodeMobileApplicationService.query.offlineQueue(),
  })
}

export function useScanOperationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ScanCommand) => barcodeMobileApplicationService.command.executeScanOperation(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useScanBundleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ScanCommand) => barcodeMobileApplicationService.command.executeScanBundle(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useScanMaterialMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ScanCommand) => barcodeMobileApplicationService.command.executeScanMaterial(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useScanFinishedGoodsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ScanCommand) => barcodeMobileApplicationService.command.executeScanFinishedGoods(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useScanProductionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ScanCommand) => barcodeMobileApplicationService.command.executeScanProduction(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useWorkflowScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeWorkflowScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useReceivingScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeReceivingScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useMaterialIssueScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeMaterialIssueScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useProductionWorkflowScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeProductionScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useFgReceiptScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeFgReceiptScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useShipmentScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: WorkflowScanCommand) => barcodeMobileApplicationService.command.executeShipmentScan(c),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useSyncOfflineQueueMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => barcodeMobileApplicationService.command.syncOfflineQueue(),
    onSuccess: () => invalidateBarcode(qc),
  })
}

export function useFlushOfflineQueueMutation() {
  return useSyncOfflineQueueMutation()
}

function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export { newIdempotencyKey }
