import {
  queryManufacturingSimulationCoverage,
  querySimulationComparison,
  querySimulationScenarios,
  runManufacturingSimulation,
} from '@/domain/brain/manufacturing-simulation'

export const brainSimulationApplicationService = {
  query: {
    run: runManufacturingSimulation,
    coverage: queryManufacturingSimulationCoverage,
    scenarios: querySimulationScenarios,
    comparison: querySimulationComparison,
  },
}
