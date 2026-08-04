import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { brainSimulationApplicationService } from './brain-simulation.application-service'

export function useManufacturingSimulationRun() {
  return useQuery({
    queryKey: applicationQueryKeys.brainSimulation.run(),
    queryFn: () => brainSimulationApplicationService.query.run(),
  })
}

export function useManufacturingSimulationCoverage() {
  return useQuery({
    queryKey: applicationQueryKeys.brainSimulation.coverage(),
    queryFn: () => brainSimulationApplicationService.query.coverage(),
  })
}

export function useSimulationScenarios() {
  return useQuery({
    queryKey: applicationQueryKeys.brainSimulation.scenarios(),
    queryFn: () => brainSimulationApplicationService.query.scenarios(),
  })
}

export function useSimulationComparison() {
  return useQuery({
    queryKey: applicationQueryKeys.brainSimulation.comparison(),
    queryFn: () => brainSimulationApplicationService.query.comparison(),
  })
}
