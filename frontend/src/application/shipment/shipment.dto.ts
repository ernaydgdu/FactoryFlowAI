import type { ShipmentRecord, ShipmentStatus } from '@/domain/shipment/shipment.types'

export type ShipmentDto = ShipmentRecord

export type ShipmentDashboardDto = {
  kpis: Array<{ label: string; value: string }>
  shipments: ShipmentDto[]
}

export type CreateShipmentCommand = {
  salesOrderId: string
  packingListId?: string
  warehouseCode?: string
  bookingNo?: string
  containerNo?: string
  containerType?: string
  sealNo?: string
  vesselName?: string
  voyageNo?: string
  portOfLoading?: string
  portOfDischarge?: string
  etd?: string
  eta?: string
  forwarderCode?: string
  idempotencyKey: string
  actorUserId: string
}

export type UpdateShipmentLogisticsCommand = {
  shipmentId: string
  bookingNo?: string
  containerNo?: string
  containerType?: string
  sealNo?: string
  vesselName?: string
  voyageNo?: string
  portOfLoading?: string
  portOfDischarge?: string
  etd?: string
  eta?: string
  forwarderCode?: string
  idempotencyKey: string
  actorUserId: string
}

export type AddLoadCommand = {
  shipmentId: string
  packingListId: string
  packageIds?: string[]
  idempotencyKey: string
  actorUserId: string
}

export type TransitionShipmentCommand = {
  shipmentId: string
  toStatus: ShipmentStatus
  note?: string
  idempotencyKey: string
  actorUserId: string
}

export type PostInventoryCommand = {
  shipmentId: string
  warehouseCode: string
  stockCardId?: string
  idempotencyKey: string
  actorUserId: string
}
