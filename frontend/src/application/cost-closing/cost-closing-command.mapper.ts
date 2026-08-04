import { runCostClosingWriteCommand } from './cost-closing-permission.guard'
import {
  CostClosingDomainError,
  persistApproveCostClosing,
  persistCalculateCostClosing,
  persistCloseCostClosing,
  persistCreateCostClosing,
  persistReconcileCostClosing,
  persistReverseCostClosing,
  persistSubmitCostClosingApproval,
} from '@/domain/cost-closing/cost-closing-crud.service'
import {
  queryAllCostClosings,
  queryCostClosingBrainReadModel,
  queryCostClosingById,
  queryCostClosingDashboard,
  queryCostClosingHistory,
} from '@/domain/cost-closing/cost-closing-query.service'

import type {
  ApproveCostClosingCommand,
  CostClosingTransitionCommand,
  CreateCostClosingCommand,
} from './cost-closing.dto'

export { CostClosingDomainError }

export function executeCreate(command: CreateCostClosingCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreateCostClosing(input, actorUserId)
  })
}

export function executeCalculate(command: CostClosingTransitionCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCalculateCostClosing(input, actorUserId)
  })
}

export function executeReconcile(command: CostClosingTransitionCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistReconcileCostClosing(input, actorUserId)
  })
}

export function executeSubmitApproval(command: CostClosingTransitionCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistSubmitCostClosingApproval(input, actorUserId)
  })
}

export function executeApprove(command: ApproveCostClosingCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistApproveCostClosing(input, actorUserId)
  })
}

export function executeClose(command: CostClosingTransitionCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCloseCostClosing(input, actorUserId)
  })
}

export function executeReverse(command: CostClosingTransitionCommand) {
  return runCostClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistReverseCostClosing(input, actorUserId)
  })
}

export function queryLists() {
  return queryAllCostClosings()
}

export function queryDetail(id: string) {
  return queryCostClosingById(id)
}

export function queryHistory() {
  return queryCostClosingHistory()
}

export function queryDashboard() {
  const d = queryCostClosingDashboard()
  return {
    kpis: [
      { label: 'Batches', value: String(d.total) },
      { label: 'Open', value: String(d.open) },
      { label: 'Calculating', value: String(d.calculating) },
      { label: 'Reconciling', value: String(d.reconciling) },
      { label: 'Approved', value: String(d.approved) },
      { label: 'Closed', value: String(d.closed) },
      { label: 'Avg variance', value: String(d.avgVariance) },
    ],
  }
}

export function queryBrain() {
  return queryCostClosingBrainReadModel()
}
