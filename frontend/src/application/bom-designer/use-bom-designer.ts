import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { bomDesignerApplicationService } from './bom-designer.application-service'
import type {
  ActivateBomRevisionCommand,
  BomLifecycleCommand,
  CreateBomCommand,
  CreateBomRevisionCommand,
  UpdateBomCommand,
} from './bom-designer.dto'
import { BomDomainError } from './bom-command.mapper'

export { BomDomainError }

function invalidateBomQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.bomDesigner.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.bomDesigner.byProduct(productId) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.detail(productId) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.list() })
}

export function useBomDesigner(productId: string, orderQty?: number) {
  return useQuery({
    queryKey: [...applicationQueryKeys.bomDesigner.byProduct(productId), orderQty ?? 1000],
    queryFn: () => bomDesignerApplicationService.query.byProduct(productId, orderQty),
    enabled: !!productId,
  })
}

export function useStockCardOptions() {
  return useQuery({
    queryKey: [...applicationQueryKeys.bomDesigner.all, 'stock-options'] as const,
    queryFn: () => bomDesignerApplicationService.query.stockOptions(),
    staleTime: 60_000,
  })
}

export function useBomRevisionCompare(productId: string, revisionRecordId: string | null) {
  return useQuery({
    queryKey: [...applicationQueryKeys.bomDesigner.byProduct(productId), 'compare', revisionRecordId] as const,
    queryFn: () =>
      bomDesignerApplicationService.query.revisionCompare(productId, revisionRecordId!),
    enabled: Boolean(productId && revisionRecordId),
  })
}

export function useCreateBomMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateBomCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.create({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useUpdateBomMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<UpdateBomCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.update({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useDeleteBomLineMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { lineId: string; expectedVersion: number; actorUserId: string }) =>
      bomDesignerApplicationService.command.deleteLine(
        productId,
        input.lineId,
        input.expectedVersion,
        input.actorUserId,
      ),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useApproveBomMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<BomLifecycleCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.approve({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useCreateBomRevisionMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateBomRevisionCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.createRevision({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useActivateBomRevisionMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<ActivateBomRevisionCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.activateRevision({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useArchiveBomMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<BomLifecycleCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.archive({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}

export function useSubmitBomForReviewMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<BomLifecycleCommand, 'productCardId'>) =>
      bomDesignerApplicationService.command.submitForReview({ ...command, productCardId: productId }),
    onSuccess: () => invalidateBomQueries(queryClient, productId),
  })
}
