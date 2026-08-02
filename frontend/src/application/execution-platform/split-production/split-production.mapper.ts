import type { SplitExecutionRecord } from '@/domain/execution-platform/execution-types'
import {
  executeSplitProduction,
  getAllSplitExecutions,
  getSplitExecutions,
} from '@/domain/execution-platform/split-execution-service'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import type {
  ExecuteSplitProductionCommand,
  SplitExecutionItemDto,
  SplitProductionViewModel,
} from './split-production.dto'

function mapSplit(r: SplitExecutionRecord): SplitExecutionItemDto {
  return {
    id: r.id,
    parentProductionOrderNo: r.parentProductionOrderNo,
    childProductionOrderNo: r.childProductionOrderNo,
    splitIndex: r.splitIndex,
    splitOfTotal: r.splitOfTotal,
    workshopCode: r.workshopCode,
    plannedQty: r.plannedQty,
    br11Applied: r.br11Applied,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
  }
}

export function querySplitProduction(parentProductionOrderNo: string): SplitProductionViewModel {
  return {
    parentProductionOrderNo,
    splits: getSplitExecutions(parentProductionOrderNo).map(mapSplit),
  }
}

export function queryAllSplitExecutions(): SplitExecutionItemDto[] {
  return getAllSplitExecutions().map(mapSplit)
}

export function commandExecuteSplitProduction(input: ExecuteSplitProductionCommand) {
  return runWithExecutionPermission(input, 'Split', 'Split', () =>
    executeSplitProduction(input).map(mapSplit),
  )
}
