import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { packagingApplicationService } from './packaging.application-service'
import type {
  AddPackageCommand,
  AutoGenerateCommand,
  BindShipmentCommand,
  CreatePackingListCommand,
  PackingListIdCommand,
} from './packaging.dto'
import { PackagingDomainError } from './packaging-command.mapper'

export { PackagingDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.packaging.all })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.inventory.all })
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

export function useCreatePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreatePackingListCommand) => packagingApplicationService.command.create(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useAddPackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AddPackageCommand) => packagingApplicationService.command.addPackage(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useValidatePackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdCommand) => packagingApplicationService.command.validate(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useConfirmPackingListMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: PackingListIdCommand) => packagingApplicationService.command.confirm(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useAutoGenerateFromFgMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AutoGenerateCommand) => packagingApplicationService.command.autoGenerateFromFg(c),
    onSuccess: () => invalidate(qc),
  })
}

export function useBindShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: BindShipmentCommand) => packagingApplicationService.command.bindShipment(c),
    onSuccess: () => invalidate(qc),
  })
}

export function newPackagingIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
