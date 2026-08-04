/** AR — ShipmentRecord aggregate port (load lines + status log embedded). */
import type { PersistedShipmentRecord } from '../persistence-aggregates'
import type { ICodedAggregateRepository } from '../repository.base'

export interface IShipmentRepository extends ICodedAggregateRepository<PersistedShipmentRecord> {
  findByShipmentNo(tenantId: string, shipmentNo: string): PersistedShipmentRecord | null
  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedShipmentRecord[]
  findByPackingListId(tenantId: string, packingListId: string): PersistedShipmentRecord[]
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedShipmentRecord | null
  nextShipmentCounter(): number
}
