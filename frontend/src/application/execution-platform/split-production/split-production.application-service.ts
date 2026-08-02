import {
  commandExecuteSplitProduction,
  queryAllSplitExecutions,
  querySplitProduction,
} from './split-production.mapper'

export const splitProductionApplicationService = {
  query: {
    getView: querySplitProduction,
    getAll: queryAllSplitExecutions,
  },
  command: {
    execute: commandExecuteSplitProduction,
  },
}
