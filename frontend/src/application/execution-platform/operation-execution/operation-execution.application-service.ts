import {
  commandCompleteOperation,
  commandPauseOperation,
  commandResumeOperation,
  commandStartOperation,
  queryOperationExecution,
  queryOperationList,
} from './operation-execution.mapper'

export const operationExecutionApplicationService = {
  query: {
    getView: queryOperationExecution,
    getList: queryOperationList,
  },
  command: {
    start: commandStartOperation,
    pause: commandPauseOperation,
    resume: commandResumeOperation,
    complete: commandCompleteOperation,
  },
}
