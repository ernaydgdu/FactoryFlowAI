import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { packagingApplicationService } from './packaging.application-service'
import type {
  AddPackageCommand,
  AssignContainerCommand,
  AutoGenerateCommand,
  BindShipmentCommand,
  CreatePackingListCommand,
  NestPackageCommand,
  PackingListIdCommand,
  PackingListIdempotentCommand,
} from './packaging.dto'
import { PackagingDomainError } from './packaging-command.mapper'

export { PackagingDomainError }

function invalidateLists(qc: ReturnType<typeof useQueryClient>, packingListId?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.lists() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.brain() })
  if (packingListId) {
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.detail(packingListId) })
    void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.pdf(packingListId) })
  }
}

export function usePackagingDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.packaging.dashboard(),
    queryFn: () => packagingApplicationService.query.dashboard(),
  })
}

export function usePackingLists() {
  return useQuery({
    queryKey: applicationQueryKeys.packaging.lists(),
    queryFn: () => packagingApplicationService.query.lists(),
  })
}

export function usePackingListDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.packaging.detail(id),
    queryFn: () => packagingApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function usePackagingBrain(salesOrderId?: string) {
  return useQuery({
    queryKey: applicationQueryKeys.packaging.brain(salesOrderId),
    queryFn: () => packagingApplicationService.query.brain(salesOrderId),
  })
}

export function usePackingListDocument(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.packaging.pdf(id),
    queryFn: () => packagingApplicationService.query.pdf(id),
    enabled: !!id,
  })
}

export function useCreatePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreatePackingListCommand) => packagingApplicationService.command.create(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useAddPackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AddPackageCommand) => packagingApplicationService.command.addPackage(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useValidatePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdCommand) => packagingApplicationService.command.validate(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useConfirmPackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdCommand) => packagingApplicationService.command.confirm(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useSubmitPackingApprovalMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdempotentCommand) =>
      packagingApplicationService.command.submitApproval(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useApprovePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdempotentCommand) =>
      packagingApplicationService.command.approve(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useRevisePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdempotentCommand) =>
      packagingApplicationService.command.revise(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useAssignContainerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AssignContainerCommand) =>
      packagingApplicationService.command.assignContainer(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useNestPackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: NestPackageCommand) => packagingApplicationService.command.nestPackage(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useAutoGenerateFromFgMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AutoGenerateCommand) =>
      packagingApplicationService.command.autoGenerateFromFg(c),
    onSuccess: (pl) => invalidateLists(qc, pl.id),
  })
}

export function useBindShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: BindShipmentCommand) => packagingApplicationService.command.bindShipment(c),
    onSuccess: (pl) => {
      invalidateLists(qc, pl.id)
      void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.movements() })
      void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.balances() })
    },
  })
}

export function newPackagingIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
