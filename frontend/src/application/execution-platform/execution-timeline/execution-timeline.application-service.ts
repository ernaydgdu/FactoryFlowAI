import {
  queryAllExecutionTimelineEvents,
  queryExecutionEventCatalog,
  queryExecutionTimeline,
} from './execution-timeline.mapper'

export const executionTimelineApplicationService = {
  query: {
    getTimeline: queryExecutionTimeline,
    getAllEvents: queryAllExecutionTimelineEvents,
    getEventCatalog: queryExecutionEventCatalog,
  },
  command: {},
}
