import { runStyleClosingWriteCommand } from './style-closing-permission.guard'
import {
  StyleClosingDomainError,
  persistApproveStyleClosing,
  persistCheckStyleClosing,
  persistCloseStyleClosing,
  persistCreateStyleClosing,
  persistSubmitStyleClosingApproval,
} from '@/domain/style-closing/style-closing-crud.service'
import {
  queryAllStyleClosings,
  queryStyleClosingBrainReadModel,
  queryStyleClosingById,
  queryStyleClosingDashboard,
  queryStyleClosingHistory,
} from '@/domain/style-closing/style-closing-query.service'

import type {
  ApproveStyleClosingCommand,
  CreateStyleClosingCommand,
  StyleClosingTransitionCommand,
} from './style-closing.dto'

export { StyleClosingDomainError }

export function executeCreate(command: CreateStyleClosingCommand) {
  return runStyleClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreateStyleClosing(input, actorUserId)
  })
}

export function executeCheck(command: StyleClosingTransitionCommand) {
  return runStyleClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCheckStyleClosing(input, actorUserId)
  })
}

export function executeSubmitApproval(command: StyleClosingTransitionCommand) {
  return runStyleClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistSubmitStyleClosingApproval(input, actorUserId)
  })
}

export function executeApprove(command: ApproveStyleClosingCommand) {
  return runStyleClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistApproveStyleClosing(input, actorUserId)
  })
}

export function executeClose(command: StyleClosingTransitionCommand) {
  return runStyleClosingWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCloseStyleClosing(input, actorUserId)
  })
}

export function queryLists() {
  return queryAllStyleClosings()
}

export function queryDetail(id: string) {
  return queryStyleClosingById(id)
}

export function queryHistory() {
  return queryStyleClosingHistory()
}

export function queryDashboard() {
  const d = queryStyleClosingDashboard()
  return {
    kpis: [
      { label: 'Styles', value: String(d.total) },
      { label: 'Open', value: String(d.open) },
      { label: 'Checking', value: String(d.checking) },
      { label: 'Ready', value: String(d.ready) },
      { label: 'Approved', value: String(d.approved) },
      { label: 'Closed', value: String(d.closed) },
      { label: 'Avg margin %', value: String(d.avgMargin) },
    ],
  }
}

export function queryBrain() {
  return queryStyleClosingBrainReadModel()
}
