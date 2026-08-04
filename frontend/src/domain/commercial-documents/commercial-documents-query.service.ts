import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExportDocumentSet } from '@/domain/ports/persistence/persistence-aggregates'

import { validateExportDocumentSet } from './commercial-documents-crud.service'
import type {
  CommercialDocumentsBrainReadModel,
  ExportDocumentSet,
} from './commercial-documents.types'

function strip(row: PersistedExportDocumentSet): ExportDocumentSet {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllExportDocumentSets(): ExportDocumentSet[] {
  const page = requireUnitOfWork().exportDocumentSets.cursor(
    DEFAULT_TENANT_ID,
    {},
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(strip).sort((a, b) => b.documentSetNo.localeCompare(a.documentSetNo))
}

export function queryExportDocumentSetById(id: string): ExportDocumentSet | null {
  const row = requireUnitOfWork().exportDocumentSets.findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryCommercialInvoices(): Array<
  ExportDocumentSet['commercialInvoice'] & {
    documentSetId: string
    documentSetNo: string
    shipmentNo: string
    salesOrderNo: string
  }
> {
  return queryAllExportDocumentSets().map((s) => ({
    ...s.commercialInvoice,
    documentSetId: s.id,
    documentSetNo: s.documentSetNo,
    shipmentNo: s.shipmentNo,
    salesOrderNo: s.salesOrderNo,
  }))
}

export function queryCommercialDocumentsDashboard() {
  const sets = queryAllExportDocumentSets()
  return {
    total: sets.length,
    draft: sets.filter((s) => s.status === 'Draft').length,
    underReview: sets.filter((s) => s.status === 'UnderReview').length,
    approved: sets.filter((s) => s.status === 'Approved').length,
    issued: sets.filter((s) => s.status === 'Issued').length,
    archived: sets.filter((s) => s.status === 'Archived').length,
  }
}

export function queryCommercialDocumentsBrainReadModel(): CommercialDocumentsBrainReadModel {
  const sets = queryAllExportDocumentSets()
  return {
    totalSets: sets.length,
    draft: sets.filter((s) => s.status === 'Draft').length,
    underReview: sets.filter((s) => s.status === 'UnderReview').length,
    approved: sets.filter((s) => s.status === 'Approved').length,
    issued: sets.filter((s) => s.status === 'Issued').length,
    archived: sets.filter((s) => s.status === 'Archived').length,
    openValidationErrors: sets.reduce((n, s) => n + s.validationErrors.length, 0),
    sets: sets.map((s) => ({
      id: s.id,
      documentSetNo: s.documentSetNo,
      invoiceNo: s.commercialInvoice.invoiceNo,
      status: s.status,
      shipmentNo: s.shipmentNo,
      packingListNo: s.packingListReference.packingListNo,
      totalQty: s.commercialInvoice.totalQty,
      totalAmount: s.commercialInvoice.totalAmount,
      volumeCbm: s.commercialInvoice.volumeCbm,
    })),
  }
}

export function queryAiDocumentValidation(documentSetId: string) {
  const set = queryExportDocumentSetById(documentSetId)
  if (!set) return null
  return validateExportDocumentSet(set)
}
