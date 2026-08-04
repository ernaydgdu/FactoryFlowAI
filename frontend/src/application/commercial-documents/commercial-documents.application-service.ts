import {
  executeAttachDocument,
  executeCreateExportDocumentSet,
  executeReviseDocumentSet,
  executeTransitionDocumentSet,
  executeValidateDocumentSet,
  queryAiValidation,
  queryBrain,
  queryDashboard,
  queryDocumentSet,
  queryDocumentSets,
  queryInvoiceList,
} from './commercial-documents-command.mapper'

export const commercialDocumentsApplicationService = {
  query: {
    dashboard: queryDashboard,
    invoices: queryInvoiceList,
    sets: queryDocumentSets,
    detail: queryDocumentSet,
    brain: queryBrain,
    aiValidation: queryAiValidation,
  },
  command: {
    create: executeCreateExportDocumentSet,
    transition: executeTransitionDocumentSet,
    attach: executeAttachDocument,
    revise: executeReviseDocumentSet,
    validate: executeValidateDocumentSet,
  },
}
