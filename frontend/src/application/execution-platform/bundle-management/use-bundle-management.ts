import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { bundleManagementApplicationService } from './bundle-management.application-service'
import type {
  CancelBundleCommand,
  CreateBundlesCommand,
  HoldBundleCommand,
  MergeBundlesCommand,
  MoveBundleCommand,
  ReportBundleDamagedCommand,
  ReportBundleLostCommand,
  ReworkBundleCommand,
  RollbackBundleCommand,
  SplitBundleCommand,
} from './bundle-management.dto'
import type { BundleActorCommand } from './bundle-management.dto'

const keys = {
  all: ['execution-platform', 'bundle'] as const,
  management: (po: string) => [...keys.all, 'management', po] as const,
  list: (po: string) => [...keys.all, 'list', po] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
  scan: (barcode: string) => [...keys.all, 'scan', barcode] as const,
}

export function useBundleManagement(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.management(productionOrderNo),
    queryFn: () => bundleManagementApplicationService.query.getManagementView(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useBundleList(productionOrderNo: string) {
  return useQuery({
    queryKey: keys.list(productionOrderNo),
    queryFn: () => bundleManagementApplicationService.query.getList(productionOrderNo),
    enabled: !!productionOrderNo,
  })
}

export function useBundleDetail(bundleId: string) {
  return useQuery({
    queryKey: keys.detail(bundleId),
    queryFn: () => bundleManagementApplicationService.query.getDetail(bundleId),
    enabled: !!bundleId,
  })
}

export function useBundleScan(barcode: string, enabled = true) {
  return useQuery({
    queryKey: keys.scan(barcode),
    queryFn: () => bundleManagementApplicationService.query.scan({ barcode }),
    enabled: enabled && !!barcode,
  })
}

function useBundleMutation<TInput, TResult>(fn: (input: TInput) => TResult) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => fn(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all })
      void qc.invalidateQueries({ queryKey: ['execution-platform'] })
    },
  })
}

export function useCreateBundles() {
  return useBundleMutation((input: CreateBundlesCommand) =>
    bundleManagementApplicationService.command.createBundles(input),
  )
}

export function usePrintBundleTicket() {
  return useBundleMutation((input: BundleActorCommand & { bundleId: string }) =>
    bundleManagementApplicationService.command.printTicket(input),
  )
}

export function useIssueBundle() {
  return useBundleMutation((input: BundleActorCommand & { bundleId: string }) =>
    bundleManagementApplicationService.command.issue(input),
  )
}

export function useMoveBundle() {
  return useBundleMutation((input: MoveBundleCommand) =>
    bundleManagementApplicationService.command.move(input),
  )
}

export function useHoldBundle() {
  return useBundleMutation((input: HoldBundleCommand) =>
    bundleManagementApplicationService.command.hold(input),
  )
}

export function useCompleteBundle() {
  return useBundleMutation((input: BundleActorCommand & { bundleId: string }) =>
    bundleManagementApplicationService.command.complete(input),
  )
}

export function useCancelBundle() {
  return useBundleMutation((input: CancelBundleCommand) =>
    bundleManagementApplicationService.command.cancel(input),
  )
}

export function useReworkBundle() {
  return useBundleMutation((input: ReworkBundleCommand) =>
    bundleManagementApplicationService.command.rework(input),
  )
}

export function useSplitBundle() {
  return useBundleMutation((input: SplitBundleCommand) =>
    bundleManagementApplicationService.command.split(input),
  )
}

export function useMergeBundles() {
  return useBundleMutation((input: MergeBundlesCommand) =>
    bundleManagementApplicationService.command.merge(input),
  )
}

export function useReportBundleLost() {
  return useBundleMutation((input: ReportBundleLostCommand) =>
    bundleManagementApplicationService.command.reportLost(input),
  )
}

export function useReportBundleDamaged() {
  return useBundleMutation((input: ReportBundleDamagedCommand) =>
    bundleManagementApplicationService.command.reportDamaged(input),
  )
}

export function useRollbackBundle() {
  return useBundleMutation((input: RollbackBundleCommand) =>
    bundleManagementApplicationService.command.rollback(input),
  )
}

export { keys as bundleManagementQueryKeys }
