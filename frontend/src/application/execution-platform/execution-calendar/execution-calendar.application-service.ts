import { queryExecutionCalendar } from './execution-calendar.mapper'

export const executionCalendarApplicationService = {
  query: { getCalendar: queryExecutionCalendar },
  command: {},
}
