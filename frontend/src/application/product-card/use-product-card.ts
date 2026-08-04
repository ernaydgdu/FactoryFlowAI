import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { productCardApplicationService } from './product-card.application-service'
import type {
  CreateProductCardCommand,
  CreateRevisionCommand,
  ProductCardLifecycleCommand,
  UpdateProductCardCommand,
} from './product-card.dto'
import { ProductCardDomainError } from './product-card-command.mapper'

export { ProductCardDomainError }

function invalidateProductCardQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.all })
  if (id) {
    void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.detail(id) })
  }
}

export function useProductCardList() {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.list(),
    queryFn: () => productCardApplicationService.query.list(),
  })
}

export function useProductCardDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.detail(id),
    queryFn: () => productCardApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useProductCardKpis() {
  return useQuery({
    queryKey: applicationQueryKeys.productCard.kpis(),
    queryFn: () => productCardApplicationService.query.kpis(),
  })
}

export function useApprovedProductCardOptions() {
  return useQuery({
    queryKey: [...applicationQueryKeys.productCard.all, 'approved-options'] as const,
    queryFn: () => productCardApplicationService.query.approvedOptions(),
    staleTime: 30_000,
  })
}

export function useProductCardEditForm(id: string) {
  return useQuery({
    queryKey: [...applicationQueryKeys.productCard.all, 'edit', id] as const,
    queryFn: () => productCardApplicationService.query.editForm(id),
    enabled: !!id,
  })
}

export function useCreateProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateProductCardCommand) =>
      productCardApplicationService.command.create(command),
    onSuccess: () => invalidateProductCardQueries(queryClient),
  })
}

export function useUpdateProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: UpdateProductCardCommand) =>
      productCardApplicationService.command.update(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useCreateProductCardRevisionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateRevisionCommand) =>
      productCardApplicationService.command.createRevision(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useApproveProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ProductCardLifecycleCommand) =>
      productCardApplicationService.command.approve(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useSubmitProductCardForReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ProductCardLifecycleCommand) =>
      productCardApplicationService.command.submitForReview(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useActivateProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ProductCardLifecycleCommand) =>
      productCardApplicationService.command.activate(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useDeactivateProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ProductCardLifecycleCommand) =>
      productCardApplicationService.command.deactivate(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}

export function useArchiveProductCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ProductCardLifecycleCommand) =>
      productCardApplicationService.command.archive(command),
    onSuccess: (result) => invalidateProductCardQueries(queryClient, result.id),
  })
}
