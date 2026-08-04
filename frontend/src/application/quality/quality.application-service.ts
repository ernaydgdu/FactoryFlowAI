import {
  executeAccept,
  executeCompleteRework,
  executeHold,
  executeInspection,
  executeReject,
  executeRework,
} from './quality-command.mapper'
import {
  mapCapaPlan,
  mapHoldQueue,
  mapInspectionList,
  mapQualityDashboard,
  mapReworkQueue,
} from './quality.mapper'
import { listQcPlanSteps } from '@/domain/quality/qc-plan.service'

export const qualityApplicationService = {
  query: {
    dashboard: mapQualityDashboard,
    inspections: mapInspectionList,
    reworkQueue: mapReworkQueue,
    holdQueue: mapHoldQueue,
    qcPlanSteps: listQcPlanSteps,
    capaPlan: mapCapaPlan,
  },
  command: {
    inspection: executeInspection,
    accept: executeAccept,
    reject: executeReject,
    rework: executeRework,
    hold: executeHold,
    completeRework: executeCompleteRework,
  },
}
