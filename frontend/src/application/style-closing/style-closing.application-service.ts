import {
  executeApprove,
  executeCheck,
  executeClose,
  executeCreate,
  executeSubmitApproval,
  queryBrain,
  queryDashboard,
  queryDetail,
  queryHistory,
  queryLists,
} from './style-closing-command.mapper'

export const styleClosingApplicationService = {
  query: {
    dashboard: queryDashboard,
    lists: queryLists,
    detail: queryDetail,
    history: queryHistory,
    brain: queryBrain,
  },
  command: {
    create: executeCreate,
    check: executeCheck,
    submitApproval: executeSubmitApproval,
    approve: executeApprove,
    close: executeClose,
  },
}
