import { executeReschedulePlan } from './production-planning-scheduling-command.mapper'
import {
  mapCapacityView,
  mapLineLoadList,
  mapScheduleBoard,
} from './production-planning-scheduling.mapper'

export const productionPlanningSchedulingApplicationService = {
  query: {
    scheduleBoard: mapScheduleBoard,
    capacityView: mapCapacityView,
    lineLoad: mapLineLoadList,
  },
  command: {
    reschedulePlan: executeReschedulePlan,
  },
}
