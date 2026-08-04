/** AR — ExportDocumentSet (embeds CommercialInvoice + export docs). */
import type { PersistedExportDocumentSet } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IExportDocumentSetRepository
  extends ICodedAggregateRepository<PersistedExportDocumentSet> {
  findByDocumentSetNo(tenantId: string, documentSetNo: string): PersistedExportDocumentSet | null
  findByInvoiceNo(tenantId: string, invoiceNo: string): PersistedExportDocumentSet | null
  findByShipmentId(tenantId: string, shipmentId: string): PersistedExportDocumentSet[]
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedExportDocumentSet | null
  nextDocumentSetCounter(): number
  nextInvoiceCounter(): number
}
