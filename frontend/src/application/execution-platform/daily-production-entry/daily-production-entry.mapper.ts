import type { OperationDailyEntry } from '@/domain/execution-platform/execution-types'
import {
  getOperationDailyEntries,
  postOperationDailyEntry,
} from '@/domain/execution-platform/execution-platform-service'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import type {
  DailyProductionEntryItemDto,
  DailyProductionEntryViewModel,
  PostDailyEntryCommand,
} from './daily-production-entry.dto'

function mapEntry(e: OperationDailyEntry): DailyProductionEntryItemDto {
  return {
    id: e.id,
    productionOrderNo: e.productionOrderNo,
    operationCode: e.operationCode,
    lineId: e.lineId,
    operatorId: e.operatorId,
    machineId: e.machineId,
    shiftCode: e.shiftCode,
    bundleId: e.bundleId,
    entryDate: e.entryDate,
    planned: e.planned,
    produced: e.produced,
    reject: e.reject,
    rework: e.rework,
    secondQuality: e.secondQuality,
    fire: e.fire,
    downtimeMinutes: e.downtimeMinutes,
    posted: e.posted,
    recordedBy: e.recordedBy,
    recordedAt: e.recordedAt,
  }
}

export function queryDailyProductionEntries(productionOrderNo: string): DailyProductionEntryViewModel {
  return {
    productionOrderNo,
    entries: getOperationDailyEntries(productionOrderNo).map(mapEntry),
  }
}

export function commandPostDailyEntry(input: PostDailyEntryCommand) {
  return runWithExecutionPermission(input, 'Create', 'DailyEntry', () => {
    const entry = postOperationDailyEntry({ ...input, recordedBy: input.actor })
    return mapEntry(entry)
  })
}
