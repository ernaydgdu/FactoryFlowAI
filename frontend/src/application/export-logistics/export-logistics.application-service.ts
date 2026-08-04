import {
  executeAssignContainer,
  executeClearCustoms,
  executeConfirmBooking,
  executeCreateExportShipment,
  executeTransition,
  queryBrain,
  queryDashboard,
  queryExportShipment,
  queryExportShipments,
} from './export-logistics-command.mapper'

export const exportLogisticsApplicationService = {
  query: {
    dashboard: queryDashboard,
    lists: queryExportShipments,
    detail: queryExportShipment,
    brain: queryBrain,
  },
  command: {
    create: executeCreateExportShipment,
    confirmBooking: executeConfirmBooking,
    assignContainer: executeAssignContainer,
    clearCustoms: executeClearCustoms,
    transition: executeTransition,
  },
}
