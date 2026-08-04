import {
  executeApprove,
  executeCalculate,
  executeClose,
  executeCreate,
  executeReconcile,
  executeReverse,
  executeSubmitApproval,
  queryBrain,
  queryDashboard,
  queryDetail,
  queryHistory,
  queryLists,
} from './cost-closing-command.mapper'

export const costClosingApplicationService = {
  query: {
    dashboard: queryDashboard,
    lists: queryLists,
    detail: queryDetail,
    history: queryHistory,
    brain: queryBrain,
  },
  command: {
    create: executeCreate,
    calculate: executeCalculate,
    reconcile: executeReconcile,
    submitApproval: executeSubmitApproval,
    approve: executeApprove,
    close: executeClose,
    reverse: executeReverse,
  },
}
