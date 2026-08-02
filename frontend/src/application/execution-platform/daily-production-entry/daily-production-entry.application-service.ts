import { commandPostDailyEntry, queryDailyProductionEntries } from './daily-production-entry.mapper'

export const dailyProductionEntryApplicationService = {
  query: { getEntries: queryDailyProductionEntries },
  command: { post: commandPostDailyEntry },
}
