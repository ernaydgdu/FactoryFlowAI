import {
  queryGlobalWipDensity,
  queryWipMonitoring,
  queryWipPositions,
  queryWipTransfers,
} from './wip-monitoring.mapper'

export const wipMonitoringApplicationService = {
  query: {
    getView: queryWipMonitoring,
    getPositions: queryWipPositions,
    getTransfers: queryWipTransfers,
    getGlobalDensity: queryGlobalWipDensity,
  },
  command: {},
}
