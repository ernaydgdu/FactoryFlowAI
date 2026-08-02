import {
  queryExecutionContext,
  queryExecutionContextList,
  queryExecutionDashboard,
} from './dashboard.mapper'

export const executionDashboardApplicationService = {
  query: {
    getDashboard: queryExecutionDashboard,
    getContextList: queryExecutionContextList,
    getContext: queryExecutionContext,
  },
}
