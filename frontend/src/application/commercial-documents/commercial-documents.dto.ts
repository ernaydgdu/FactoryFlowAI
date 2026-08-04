import type {
  CommercialDocumentsBrainReadModel,
  CommercialDocumentValidationResult,
  DocumentLifecycleStatus,
  ExportDocumentSet,
} from '@/domain/commercial-documents/commercial-documents.types'

export type ExportDocumentSetDto = ExportDocumentSet
export type CommercialDocumentsBrainDto = CommercialDocumentsBrainReadModel
export type CommercialDocumentValidationDto = CommercialDocumentValidationResult

export type CommercialDocumentsDashboardDto = {
  kpis: Array<{ label: string; value: string }>
  invoices: Array<{
    id: string
    invoiceNo: string
    documentSetId: string
    documentSetNo: string
    status: DocumentLifecycleStatus
    shipmentNo: string
    salesOrderNo: string
    totalQty: number
    totalAmount: number
    currency: string
  }>
}

export type CreateExportDocumentSetCommand = {
  shipmentId: string
  unitPrice?: number
  currency?: string
  incoterm?: string
  paymentTerm?: string
  countryOfOrigin?: string
  idempotencyKey: string
  actorUserId: string
}

export type TransitionDocumentSetCommand = {
  documentSetId: string
  toStatus: DocumentLifecycleStatus
  note?: string
  idempotencyKey: string
  actorUserId: string
}

export type AttachDocumentCommand = {
  documentSetId: string
  fileName: string
  mimeType: string
  documentKind: string
  idempotencyKey: string
  actorUserId: string
}

export type ReviseDocumentSetCommand = {
  documentSetId: string
  reason?: string
  idempotencyKey: string
  actorUserId: string
}

export type DocumentSetIdCommand = {
  documentSetId: string
  actorUserId: string
}
