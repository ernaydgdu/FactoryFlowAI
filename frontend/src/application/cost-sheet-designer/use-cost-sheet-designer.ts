import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { costSheetDesignerApplicationService } from './cost-sheet-designer.application-service'
import type {
  ActivateCostSheetRevisionCommand,
  CostSheetLifecycleCommand,
  CreateCostSheetCommand,
  CreateCostSheetRevisionCommand,
  UpdateCostSheetCommand,
} from './cost-sheet-designer.dto'
import { CostSheetDomainError } from './cost-sheet-command.mapper'

export { CostSheetDomainError }

function invalidateCostSheetQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.costSheetDesigner.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.costSheetDesigner.byProduct(productId) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.bomDesigner.byProduct(productId) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.detail(productId) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productCard.list() })
}

export function useCostSheetDesigner(productId: string) {
  return useQuery({
    queryKey: applicationQueryKeys.costSheetDesigner.byProduct(productId),
    queryFn: () => costSheetDesignerApplicationService.query.byProduct(productId),
    enabled: !!productId,
  })
}

export function useCostSheetRevisionCompare(productId: string, revisionRecordId: string | null) {
  return useQuery({
    queryKey: [...applicationQueryKeys.costSheetDesigner.byProduct(productId), 'compare', revisionRecordId] as const,
    queryFn: () =>
      costSheetDesignerApplicationService.query.revisionCompare(productId, revisionRecordId!),
    enabled: Boolean(productId && revisionRecordId),
  })
}

export function useCreateCostSheetMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateCostSheetCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.create({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useUpdateCostSheetMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<UpdateCostSheetCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.update({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useApproveCostSheetMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CostSheetLifecycleCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.approve({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useCreateCostSheetRevisionMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateCostSheetRevisionCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.createRevision({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useActivateCostSheetRevisionMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<ActivateCostSheetRevisionCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.activateRevision({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useArchiveCostSheetMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CostSheetLifecycleCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.archive({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useSubmitCostSheetForReviewMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CostSheetLifecycleCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.submitForReview({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}

export function useRecalculatePlannedCostMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CostSheetLifecycleCommand, 'productCardId'>) =>
      costSheetDesignerApplicationService.command.recalculate({ ...command, productCardId: productId }),
    onSuccess: () => invalidateCostSheetQueries(queryClient, productId),
  })
}
