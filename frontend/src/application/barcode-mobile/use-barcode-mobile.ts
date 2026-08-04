import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { barcodeMobileApplicationService } from './barcode-mobile.application-service'
import type { ScanCommand } from './barcode-mobile.dto'
import { BarcodeMobileDomainError } from './barcode-mobile-command.mapper'

export { BarcodeMobileDomainError }

function invalidateBarcode(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.barcodeMobile.all })
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

export function useFlushOfflineQueueMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => barcodeMobileApplicationService.command.flushOfflineQueue(),
    onSuccess: () => invalidateBarcode(qc),
  })
}
