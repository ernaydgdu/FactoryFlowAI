import {
  queryManufacturingPlanningCoverage,
  queryPlanningPlans,
  queryPreferredPlan,
  runManufacturingPlanning,
} from '@/domain/brain/manufacturing-planning'

export const brainPlanningApplicationService = {
  query: {
    run: runManufacturingPlanning,
    coverage: queryManufacturingPlanningCoverage,
    plans: queryPlanningPlans,
    preferred: queryPreferredPlan,
  },
}
