import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { enterpriseHardeningApplicationService } from './enterprise-hardening.application-service'

export function useEnterpriseDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.dashboard(),
    queryFn: () => enterpriseHardeningApplicationService.query.dashboard(),
  })
}

export function useEnterpriseHealth() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.health(),
    queryFn: () => enterpriseHardeningApplicationService.query.health(),
  })
}

export function useBootstrapDiagnostics() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.bootstrap(),
    queryFn: () => enterpriseHardeningApplicationService.query.bootstrap(),
    refetchInterval: 5000,
  })
}

export function useEnterprisePerformance() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.performance(),
    queryFn: () => enterpriseHardeningApplicationService.query.performance(),
    refetchInterval: 5000,
  })
}

export function useEnterpriseAudit() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.audit(),
    queryFn: () => enterpriseHardeningApplicationService.query.audit(),
  })
}

export function useEnterpriseAiFoundation() {
  return useQuery({
    queryKey: applicationQueryKeys.enterpriseHardening.ai(),
    queryFn: () => enterpriseHardeningApplicationService.query.ai(),
  })
}
