import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'
import type {
  CreateMasterDataCommand,
  LifecycleMasterDataCommand,
  UpdateMasterDataCommand,
} from './master-data.dto'
import { masterDataApplicationService } from './master-data.application-service'
import { MasterDataDomainError } from './master-data.mapper'

export { MasterDataDomainError }

export function useMasterDataList(entityKey: MasterDataCrudEntityKey) {
  return useQuery({
    queryKey: applicationQueryKeys.masterData.list(entityKey),
    queryFn: () => masterDataApplicationService.query.list(entityKey),
  })
}

export function useMasterDataDetail(entityKey: MasterDataCrudEntityKey, id: string | null) {
  return useQuery({
    queryKey: applicationQueryKeys.masterData.detail(entityKey, id ?? ''),
    queryFn: () => masterDataApplicationService.query.byId(entityKey, id!),
    enabled: Boolean(id),
  })
}

export function useMasterDataReferenceOptions(
  refKey: MasterDataCrudEntityKey | 'country' | 'currency' | 'seasonType',
) {
  return useQuery({
    queryKey: applicationQueryKeys.masterData.references(refKey),
    queryFn: () => masterDataApplicationService.query.referenceOptions(refKey),
    staleTime: 60_000,
  })
}

function invalidateMasterDataQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  entityKey: MasterDataCrudEntityKey,
) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.masterData.list(entityKey) })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.masterData.all })
}

export function useCreateMasterDataMutation(entityKey: MasterDataCrudEntityKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<CreateMasterDataCommand, 'entityKey'>) =>
      masterDataApplicationService.command.create({ ...command, entityKey }),
    onSuccess: () => invalidateMasterDataQueries(queryClient, entityKey),
  })
}

export function useUpdateMasterDataMutation(entityKey: MasterDataCrudEntityKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<UpdateMasterDataCommand, 'entityKey'>) =>
      masterDataApplicationService.command.update({ ...command, entityKey }),
    onSuccess: () => invalidateMasterDataQueries(queryClient, entityKey),
  })
}

export function useDeactivateMasterDataMutation(entityKey: MasterDataCrudEntityKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<LifecycleMasterDataCommand, 'entityKey'>) =>
      masterDataApplicationService.command.deactivate({ ...command, entityKey }),
    onSuccess: () => invalidateMasterDataQueries(queryClient, entityKey),
  })
}

export function useReactivateMasterDataMutation(entityKey: MasterDataCrudEntityKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: Omit<LifecycleMasterDataCommand, 'entityKey'>) =>
      masterDataApplicationService.command.reactivate({ ...command, entityKey }),
    onSuccess: () => invalidateMasterDataQueries(queryClient, entityKey),
  })
}
