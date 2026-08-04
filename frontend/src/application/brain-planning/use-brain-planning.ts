import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { brainPlanningApplicationService } from './brain-planning.application-service'

export function useManufacturingPlanningRun() {
  return useQuery({
    queryKey: applicationQueryKeys.brainPlanning.run(),
    queryFn: () => brainPlanningApplicationService.query.run(),
  })
}

export function useManufacturingPlanningCoverage() {
  return useQuery({
    queryKey: applicationQueryKeys.brainPlanning.coverage(),
    queryFn: () => brainPlanningApplicationService.query.coverage(),
  })
}

export function usePlanningPlans() {
  return useQuery({
    queryKey: applicationQueryKeys.brainPlanning.plans(),
    queryFn: () => brainPlanningApplicationService.query.plans(),
  })
}

export function usePreferredPlan() {
  return useQuery({
    queryKey: applicationQueryKeys.brainPlanning.preferred(),
    queryFn: () => brainPlanningApplicationService.query.preferred(),
  })
}
