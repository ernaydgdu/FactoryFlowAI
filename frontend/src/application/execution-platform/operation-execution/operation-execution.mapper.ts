import type { OperationExecution } from '@/domain/execution-platform/execution-types'
import {
  completeOperation,
  getOperationExecutions,
  getOperationExecutionStatusSummary,
  getParallelExecutionCapability,
  pauseOperation,
  resumeOperation,
  startOperation,
} from '@/domain/execution-platform/operation-execution-service'

import { runWithExecutionPermission } from '../shared/execution-permission.guard'
import { mapOperationStatusBadge } from '../shared/presentation.mapper'
import type {
  CompleteOperationCommand,
  OperationExecutionItemDto,
  OperationExecutionViewModel,
  PauseOperationCommand,
  StartOperationCommand,
} from './operation-execution.dto'
import type { OperationActorCommand } from './operation-execution.dto'

function mapOperation(op: OperationExecution): OperationExecutionItemDto {
  return {
    id: op.id,
    operationCode: op.operationCode,
    operationName: op.operationName,
    department: op.department,
    sequence: op.sequence,
    status: mapOperationStatusBadge(op.status),
    plannedQty: op.plannedQty,
    completedQty: op.completedQty,
    wasteQty: op.wasteQty,
    reworkQty: op.reworkQty,
    secondQualityQty: op.secondQualityQty,
    lineId: op.lineId,
    gatePassed: op.gatePassed,
    startedAt: op.startedAt,
    completedAt: op.completedAt,
  }
}

export function queryOperationExecution(productionOrderNo: string, focusOperationCode?: string): OperationExecutionViewModel {
  const operations = getOperationExecutions(productionOrderNo)
  const summary = getOperationExecutionStatusSummary(productionOrderNo)
  const opCode = focusOperationCode ?? operations.find((o) => o.status === 'InProgress')?.operationCode ?? 'SEW'
  const parallel = getParallelExecutionCapability(productionOrderNo, opCode)
  return {
    productionOrderNo,
    operations: operations.map(mapOperation),
    statusSummary: summary,
    parallelCapability: parallel,
  }
}

export function queryOperationList(productionOrderNo: string): OperationExecutionItemDto[] {
  return getOperationExecutions(productionOrderNo).map(mapOperation)
}

export function commandStartOperation(input: StartOperationCommand) {
  return runWithExecutionPermission(input, 'Update', 'Operation', () =>
    mapOperation(startOperation(input)),
  )
}

export function commandPauseOperation(input: PauseOperationCommand) {
  return runWithExecutionPermission(input, 'Update', 'Operation', () =>
    mapOperation(pauseOperation(input)),
  )
}

export function commandResumeOperation(input: OperationActorCommand) {
  return runWithExecutionPermission(input, 'Update', 'Operation', () =>
    mapOperation(resumeOperation(input)),
  )
}

export function commandCompleteOperation(input: CompleteOperationCommand) {
  return runWithExecutionPermission(input, 'Close', 'Operation', () =>
    mapOperation(completeOperation(input)),
  )
}
