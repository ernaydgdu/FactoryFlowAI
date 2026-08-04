import { useMutation, useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import type { PlatformCommandDto } from '@/application/platform/iam/iam.dto'
import {
  commandExecutePlatform,
  queryPlatformHealth,
  queryRegisteredCommands,
  queryTenantContextFromApi,
} from './platform.application-service'

export function usePlatformHealth() {
  return useQuery({
    queryKey: applicationQueryKeys.platform.health(),
    queryFn: queryPlatformHealth,
    staleTime: 30_000,
  })
}

export function useRegisteredCommands() {
  return useQuery({
    queryKey: applicationQueryKeys.platform.commands(),
    queryFn: queryRegisteredCommands,
  })
}

export function useRemoteTenantContext(enabled: boolean) {
  return useQuery({
    queryKey: applicationQueryKeys.platform.context(),
    queryFn: queryTenantContextFromApi,
    enabled,
  })
}

export function usePlatformCommandMutation() {
  return useMutation({
    mutationFn: (request: PlatformCommandDto) => commandExecutePlatform(request),
  })
}
