/**
 * Shipment Management — domain types (PRD Module 6 aligned).
 * Inventory stock outbound remains persistShipment only (no duplicate write path).
 */

export type ShipmentStatus =
  | 'Draft'
  | 'Booked'
  | 'Loaded'
  | 'Dispatched'
  | 'InTransit'
  | 'Delivered'
  | 'Closed'
  | 'Cancelled'

export type ShipmentStatusLogEntry = {
  id: string
  status: ShipmentStatus
  occurredAt: string
  actorUserId: string
  note: string | null
}

export type ShipmentLoadLine = {
  id: string
  packingListId: string
  packingListNo: string
  packageId: string
  packageNo: string
  sscc: string | null
  quantity: number
  netWeightKg: number
  grossWeightKg: number
  volumeCbm: number
}

export type ShipmentDocumentLink = {
  id: string
  documentType: 'PACKING_LIST' | 'BL_REF' | 'ASN_PLACEHOLDER' | 'OTHER'
  reference: string
  linkedAt: string
}

export type ShipmentRecord = {
  id: string
  shipmentNo: string
  salesOrderId: string
  salesOrderNo: string
  packingListIds: string[]
  status: ShipmentStatus
  statusLog: ShipmentStatusLogEntry[]
  /** Forwarder booking reference */
  bookingNo: string | null
  containerNo: string | null
  containerType: string | null
  sealNo: string | null
  vesselName: string | null
  voyageNo: string | null
  /** UN/LOCODE or free-text port codes */
  portOfLoading: string | null
  portOfDischarge: string | null
  etd: string | null
  eta: string | null
  forwarderCode: string | null
  warehouseCode: string | null
  loadLines: ShipmentLoadLine[]
  documentLinks: ShipmentDocumentLink[]
  totals: {
    packageCount: number
    totalQty: number
    netWeightKg: number
    grossWeightKg: number
    volumeCbm: number
  }
  /** Stock ledger SHIPMENT movement — set when inventory posted */
  inventoryReferenceNo: string | null
  shipmentMovementId: string | null
  closedAt: string | null
  idempotencyKey: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreateShipmentInput = {
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
}

export type UpdateShipmentLogisticsInput = {
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
}

export type AddLoadFromPackingListInput = {
  shipmentId: string
  packingListId: string
  packageIds?: string[]
  idempotencyKey: string
}

export type TransitionShipmentInput = {
  shipmentId: string
  toStatus: ShipmentStatus
  note?: string
  idempotencyKey: string
}

export type PostShipmentInventoryInput = {
  shipmentId: string
  warehouseCode: string
  stockCardId?: string
  idempotencyKey: string
}
