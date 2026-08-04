import type {
  ExportLogisticsBrainReadModel,
  ExportShipment,
  ExportShipmentStatus,
} from '@/domain/export-logistics/export-logistics.types'

export type ExportShipmentDto = ExportShipment
export type ExportLogisticsBrainDto = ExportLogisticsBrainReadModel

export type ExportLogisticsDashboardDto = {
  kpis: Array<{ label: string; value: string }>
  shipments: ExportShipmentDto[]
}

export type CreateExportShipmentCommand = {
  shipmentId: string
  idempotencyKey: string
  actorUserId: string
}

export type ConfirmBookingCommand = {
  exportShipmentId: string
  bookingNo: string
  carrierCode?: string
  carrierName?: string
  forwarderCode?: string
  forwarderName?: string
  vesselName?: string
  voyageNo?: string
  portOfLoading?: string
  portOfDischarge?: string
  etd?: string
  eta?: string
  idempotencyKey: string
  actorUserId: string
}

export type AssignContainerCommand = {
  exportShipmentId: string
  containerNo: string
  containerType: string
  sealNo: string
  idempotencyKey: string
  actorUserId: string
}

export type ClearCustomsCommand = {
  exportShipmentId: string
  note?: string
  idempotencyKey: string
  actorUserId: string
}

export type TransitionExportShipmentCommand = {
  exportShipmentId: string
  toStatus: ExportShipmentStatus
  note?: string
  idempotencyKey: string
  actorUserId: string
}
