/**
 * Commercial & Export Documents — domain types.
 * ExportDocumentSet is the persistence aggregate; CommercialInvoice is the logical
 * commercial AR nested for a single transactional write path (ADR in report).
 */

export type DocumentLifecycleStatus =
  | 'Draft'
  | 'UnderReview'
  | 'Approved'
  | 'Issued'
  | 'Archived'

export type CommercialInvoiceLine = {
  id: string
  color: string
  size: string
  quantity: number
  unitPrice: number
  lineAmount: number
}

export type CommercialInvoice = {
  id: string
  invoiceNo: string
  currency: string
  incoterm: string | null
  paymentTerm: string | null
  lines: CommercialInvoiceLine[]
  totalQty: number
  totalAmount: number
  netWeightKg: number
  grossWeightKg: number
  volumeCbm: number
  status: DocumentLifecycleStatus
}

export type PackingListReference = {
  packingListId: string
  packingListNo: string
  totalQty: number
  packageCount: number
  netWeightKg: number
  grossWeightKg: number
  volumeCbm: number
}

export type CertificateOfOrigin = {
  id: string
  certificateNo: string | null
  countryOfOrigin: string
  status: DocumentLifecycleStatus
  issuedAt: string | null
}

export type InspectionCertificate = {
  id: string
  certificateNo: string | null
  inspectionBody: string | null
  status: DocumentLifecycleStatus
  issuedAt: string | null
}

export type BillOfLadingReference = {
  id: string
  blNo: string | null
  carrier: string | null
  status: DocumentLifecycleStatus
  issuedAt: string | null
}

export type ExportDeclaration = {
  id: string
  declarationNo: string | null
  customsOffice: string | null
  status: DocumentLifecycleStatus
  issuedAt: string | null
}

export type DocumentAttachment = {
  id: string
  fileName: string
  mimeType: string
  documentKind: string
  uploadedAt: string
  uploadedBy: string
}

export type DocumentRevision = {
  id: string
  revision: number
  status: DocumentLifecycleStatus
  snapshotJson: string
  createdAt: string
  createdBy: string
  reason: string | null
}

export type DocumentApproval = {
  id: string
  action: 'Submit' | 'Approve' | 'Reject' | 'Issue' | 'Archive'
  actorUserId: string
  occurredAt: string
  note: string | null
}

export type ExportDocumentSet = {
  id: string
  documentSetNo: string
  salesOrderId: string
  salesOrderNo: string
  shipmentId: string
  shipmentNo: string
  packingListId: string
  status: DocumentLifecycleStatus
  commercialInvoice: CommercialInvoice
  packingListReference: PackingListReference
  certificateOfOrigin: CertificateOfOrigin
  inspectionCertificate: InspectionCertificate
  billOfLadingReference: BillOfLadingReference
  exportDeclaration: ExportDeclaration
  attachments: DocumentAttachment[]
  revisions: DocumentRevision[]
  approvals: DocumentApproval[]
  validationErrors: string[]
  idempotencyKey: string | null
  issuedAt: string | null
  archivedAt: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type CreateExportDocumentSetInput = {
  shipmentId: string
  unitPrice?: number
  currency?: string
  incoterm?: string
  paymentTerm?: string
  countryOfOrigin?: string
  idempotencyKey: string
}

export type TransitionDocumentSetInput = {
  documentSetId: string
  toStatus: DocumentLifecycleStatus
  note?: string
  idempotencyKey: string
}

export type AttachDocumentInput = {
  documentSetId: string
  fileName: string
  mimeType: string
  documentKind: string
  idempotencyKey: string
}

export type ReviseDocumentSetInput = {
  documentSetId: string
  reason?: string
  idempotencyKey: string
}

/** Brain / AI read-model */
export type CommercialDocumentsBrainReadModel = {
  totalSets: number
  draft: number
  underReview: number
  approved: number
  issued: number
  archived: number
  openValidationErrors: number
  sets: Array<{
    id: string
    documentSetNo: string
    invoiceNo: string
    status: DocumentLifecycleStatus
    shipmentNo: string
    packingListNo: string
    totalQty: number
    totalAmount: number
    volumeCbm: number
  }>
}

/** AI document validation surface — deterministic checks, no LLM mutate. */
export type CommercialDocumentValidationResult = {
  documentSetId: string
  ok: boolean
  errors: string[]
  checks: Array<{ code: string; passed: boolean; detail: string }>
}
