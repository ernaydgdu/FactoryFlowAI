import { runCommercialDocumentsWriteCommand } from './commercial-documents-permission.guard'
import {
  CommercialDocumentsDomainError,
  persistAttachDocument,
  persistCreateExportDocumentSet,
  persistReviseDocumentSet,
  persistTransitionDocumentSet,
  persistValidateDocumentSet,
} from '@/domain/commercial-documents/commercial-documents-crud.service'
import {
  queryAiDocumentValidation,
  queryAllExportDocumentSets,
  queryCommercialDocumentsBrainReadModel,
  queryCommercialDocumentsDashboard,
  queryCommercialInvoices,
  queryExportDocumentSetById,
} from '@/domain/commercial-documents/commercial-documents-query.service'

import type {
  AttachDocumentCommand,
  CreateExportDocumentSetCommand,
  DocumentSetIdCommand,
  ReviseDocumentSetCommand,
  TransitionDocumentSetCommand,
} from './commercial-documents.dto'

export { CommercialDocumentsDomainError }

export function executeCreateExportDocumentSet(command: CreateExportDocumentSetCommand) {
  return runCommercialDocumentsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistCreateExportDocumentSet(input, actorUserId)
  })
}

export function executeTransitionDocumentSet(command: TransitionDocumentSetCommand) {
  return runCommercialDocumentsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistTransitionDocumentSet(input, actorUserId)
  })
}

export function executeAttachDocument(command: AttachDocumentCommand) {
  return runCommercialDocumentsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistAttachDocument(input, actorUserId)
  })
}

export function executeReviseDocumentSet(command: ReviseDocumentSetCommand) {
  return runCommercialDocumentsWriteCommand(() => {
    const { actorUserId, ...input } = command
    return persistReviseDocumentSet(input, actorUserId)
  })
}

export function executeValidateDocumentSet(command: DocumentSetIdCommand) {
  return runCommercialDocumentsWriteCommand(() =>
    persistValidateDocumentSet(command.documentSetId, command.actorUserId),
  )
}

export function queryDocumentSets() {
  return queryAllExportDocumentSets()
}

export function queryDocumentSet(id: string) {
  return queryExportDocumentSetById(id)
}

export function queryInvoiceList() {
  return queryCommercialInvoices()
}

export function queryDashboard() {
  const d = queryCommercialDocumentsDashboard()
  const invoices = queryCommercialInvoices()
  return {
    kpis: [
      { label: 'Document Sets', value: String(d.total) },
      { label: 'Draft', value: String(d.draft) },
      { label: 'Under Review', value: String(d.underReview) },
      { label: 'Approved', value: String(d.approved) },
      { label: 'Issued', value: String(d.issued) },
      { label: 'Archived', value: String(d.archived) },
    ],
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNo: i.invoiceNo,
      documentSetId: i.documentSetId,
      documentSetNo: i.documentSetNo,
      status: i.status,
      shipmentNo: i.shipmentNo,
      salesOrderNo: i.salesOrderNo,
      totalQty: i.totalQty,
      totalAmount: i.totalAmount,
      currency: i.currency,
    })),
  }
}

export function queryBrain() {
  return queryCommercialDocumentsBrainReadModel()
}

export function queryAiValidation(documentSetId: string) {
  return queryAiDocumentValidation(documentSetId)
}
