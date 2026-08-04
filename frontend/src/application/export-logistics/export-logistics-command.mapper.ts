import { runExportLogisticsWriteCommand } from './export-logistics-permission.guard'
import {
  ExportLogisticsDomainError,
  persistAssignContainer,
  persistClearCustoms,
  persistConfirmBooking,
  persistCreateExportShipment,
  persistTransitionExportShipment,
} from '@/domain/export-logistics/export-logistics-crud.service'
import {
  queryAllExportShipments,
  queryExportLogisticsBrainReadModel,
  queryExportLogisticsDashboard,
  queryExportShipmentById,
} from '@/domain/export-logistics/export-logistics-query.service'

import type {
  AssignContainerCommand,
  ClearCustomsCommand,
  ConfirmBookingCommand,
  CreateExportShipmentCommand,
  TransitionExportShipmentCommand,
} from './export-logistics.dto'

export { ExportLogisticsDomainError }

export function executeCreateExportShipment(command: CreateExportShipmentCommand) {
  return runExportLogisticsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreateExportShipment(input, actorUserId)
  })
}

export function executeConfirmBooking(command: ConfirmBookingCommand) {
  return runExportLogisticsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistConfirmBooking(input, actorUserId)
  })
}

export function executeAssignContainer(command: AssignContainerCommand) {
  return runExportLogisticsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAssignContainer(input, actorUserId)
  })
}

export function executeClearCustoms(command: ClearCustomsCommand) {
  return runExportLogisticsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistClearCustoms(input, actorUserId)
  })
}

export function executeTransition(command: TransitionExportShipmentCommand) {
  return runExportLogisticsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistTransitionExportShipment(input, actorUserId)
  })
}

export function queryExportShipments() {
  return queryAllExportShipments()
}

export function queryExportShipment(id: string) {
  return queryExportShipmentById(id)
}

export function queryDashboard() {
  const d = queryExportLogisticsDashboard()
  return {
    kpis: [
      { label: 'Export Shipments', value: String(d.total) },
      { label: 'Planning', value: String(d.planning) },
      { label: 'Booked/Assigned', value: String(d.booked) },
      { label: 'Customs/Docs', value: String(d.customs) },
      { label: 'In Transit', value: String(d.inTransit) },
      { label: 'Arrived', value: String(d.arrived) },
      { label: 'Closed', value: String(d.closed) },
      { label: 'Blocked', value: String(d.blocked) },
    ],
    shipments: queryAllExportShipments(),
  }
}

export function queryBrain() {
  return queryExportLogisticsBrainReadModel()
}
