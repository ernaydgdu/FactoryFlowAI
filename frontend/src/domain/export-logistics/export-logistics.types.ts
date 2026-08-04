/**
 * Export Logistics Orchestration — ExportShipment aggregate.
 * Orchestrates Shipment + Packaging + Commercial Documents (read-only reuse).
 */

export type ExportShipmentStatus =
  | 'Planning'
  | 'Booked'
  | 'ContainerAssigned'
  | 'DocumentsComplete'
  | 'CustomsCleared'
  | 'Loaded'
  | 'Departed'
  | 'Arrived'
  | 'Closed'
  | 'Cancelled'

export type CustomsStatus = 'Pending' | 'Submitted' | 'Cleared' | 'Held' | 'Rejected'

export type ExportBooking = {
  bookingNo: string
  confirmed: boolean
  confirmedAt: string | null
}

export type ExportContainer = {
  containerNo: string
  containerType: string
  sealNo: string | null
  assignedAt: string | null
}

export type ExportCarrierInfo = {
  carrierCode: string | null
  carrierName: string | null
}

export type ExportForwarderInfo = {
  forwarderCode: string | null
  forwarderName: string | null
}

export type ExportVoyage = {
  vesselName: string | null
  voyageNo: string | null
}

export type ExportGateCheck = {
  code: string
  passed: boolean
  detail: string
}

export type ExportStatusLogEntry = {
  id: string
  status: ExportShipmentStatus
  occurredAt: string
  actorUserId: string
  note: string | null
}

export type ExportShipment = {
  id: string
  exportShipmentNo: string
  salesOrderId: string
  salesOrderNo: string
  shipmentId: string
  shipmentNo: string
  packingListId: string | null
  exportDocumentSetId: string | null
  status: ExportShipmentStatus
  customsStatus: CustomsStatus
  booking: ExportBooking
  container: ExportContainer | null
  carrier: ExportCarrierInfo
  forwarder: ExportForwarderInfo
  voyage: ExportVoyage
  portOfLoading: string | null
  portOfDischarge: string | null
  etd: string | null
  eta: string | null
  dispatchConfirmedAt: string | null
  gateChecks: ExportGateCheck[]
  statusLog: ExportStatusLogEntry[]
  riskFlags: string[]
  delayRiskScore: number
  predictedDelayDays: number
  idempotencyKey: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreateExportShipmentInput = {
  shipmentId: string
  idempotencyKey: string
}

export type ConfirmBookingInput = {
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
}

export type AssignContainerInput = {
  exportShipmentId: string
  containerNo: string
  containerType: string
  sealNo: string
  idempotencyKey: string
}

export type TransitionExportShipmentInput = {
  exportShipmentId: string
  toStatus: ExportShipmentStatus
  note?: string
  idempotencyKey: string
}

export type ClearCustomsInput = {
  exportShipmentId: string
  note?: string
  idempotencyKey: string
}

/** Brain orchestration / delay prediction surface */
export type ExportLogisticsBrainReadModel = {
  total: number
  planning: number
  inTransit: number
  blocked: number
  closed: number
  avgDelayRiskScore: number
  shipments: Array<{
    id: string
    exportShipmentNo: string
    status: ExportShipmentStatus
    customsStatus: CustomsStatus
    delayRiskScore: number
    predictedDelayDays: number
    riskFlags: string[]
    gateFailures: string[]
  }>
}
