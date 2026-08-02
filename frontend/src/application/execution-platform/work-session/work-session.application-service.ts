import {
  commandCompleteWorkSession,
  commandPauseWorkSession,
  commandResumeWorkSession,
  commandStartWorkSession,
  queryWorkSessionList,
  queryWorkSessionView,
} from './work-session.mapper'

export const workSessionApplicationService = {
  query: {
    getView: queryWorkSessionView,
    getList: queryWorkSessionList,
  },
  command: {
    start: commandStartWorkSession,
    pause: commandPauseWorkSession,
    resume: commandResumeWorkSession,
    complete: commandCompleteWorkSession,
  },
}
