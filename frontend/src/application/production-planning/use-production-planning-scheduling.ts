import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import type { SchedulingMode } from '@/domain/production-planning/planning.types'

import { productionPlanningSchedulingApplicationService } from './production-planning-scheduling.application-service'
import type { ReschedulePlanCommand } from './production-planning-scheduling-command.mapper'
import { PlanningDomainError } from './production-planning-scheduling-command.mapper'

export { PlanningDomainError }

function invalidatePlanningQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productionPlanning.all })
  void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productionOrder.all })
  void queryClient.invalidateQueries({ queryKey: ['production-order-lifecycle'] })
  void queryClient.invalidateQueries({ queryKey: ['production-planning'] })
}

export function useScheduleBoard(mode: SchedulingMode) {
  return useQuery({
    queryKey: applicationQueryKeys.productionPlanning.scheduleBoard(mode),
    queryFn: () => productionPlanningSchedulingApplicationService.query.scheduleBoard(mode),
  })
}

export function useCapacityView(mode: SchedulingMode) {
  return useQuery({
    queryKey: applicationQueryKeys.productionPlanning.capacityView(mode),
    queryFn: () => productionPlanningSchedulingApplicationService.query.capacityView(mode),
  })
}

export function useLineLoad(mode: SchedulingMode) {
  return useQuery({
    queryKey: applicationQueryKeys.productionPlanning.lineLoad(mode),
    queryFn: () => productionPlanningSchedulingApplicationService.query.lineLoad(mode),
  })
}

export function useReschedulePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReschedulePlanCommand) =>
      productionPlanningSchedulingApplicationService.command.reschedulePlan(command),
    onSuccess: () => invalidatePlanningQueries(queryClient),
  })
}
