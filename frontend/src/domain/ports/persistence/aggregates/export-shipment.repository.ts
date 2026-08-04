/** AR — ExportShipment orchestration port. */
import type { PersistedExportShipment } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IExportShipmentRepository extends ICodedAggregateRepository<PersistedExportShipment> {
  findByExportShipmentNo(tenantId: string, exportShipmentNo: string): PersistedExportShipment | null
  findByShipmentId(tenantId: string, shipmentId: string): PersistedExportShipment | null
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedExportShipment | null
  nextExportShipmentCounter(): number
}
