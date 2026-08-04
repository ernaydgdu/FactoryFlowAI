import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedShipmentRecord } from '@/domain/ports/persistence/persistence-aggregates'
import type { IShipmentRepository } from '@/domain/ports/persistence/aggregates/shipment.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ShipmentInMemoryRepository implements IShipmentRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedShipmentRecord | null {
    return (
      this.stores.shipments.find((s) => s.tenantId === tenantId && s.id === id && !s.deletedAt) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedShipmentRecord | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedShipmentRecord | null {
    return this.findByShipmentNo(tenantId, code)
  }

  findByShipmentNo(tenantId: string, shipmentNo: string): PersistedShipmentRecord | null {
    return (
      this.stores.shipments.find(
        (s) => s.tenantId === tenantId && s.shipmentNo === shipmentNo && !s.deletedAt,
      ) ?? null
    )
  }

  findBySalesOrderId(tenantId: string, salesOrderId: string): PersistedShipmentRecord[] {
    return this.stores.shipments.filter(
      (s) => s.tenantId === tenantId && s.salesOrderId === salesOrderId && !s.deletedAt,
    )
  }

  findByPackingListId(tenantId: string, packingListId: string): PersistedShipmentRecord[] {
    return this.stores.shipments.filter(
      (s) => s.tenantId === tenantId && s.packingListIds.includes(packingListId) && !s.deletedAt,
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedShipmentRecord | null {
    return (
      this.stores.shipments.find(
        (s) => s.tenantId === tenantId && s.idempotencyKey === idempotencyKey && !s.deletedAt,
      ) ?? null
    )
  }

  nextShipmentCounter(): number {
    this.stores.shipmentCounter += 1
    return this.stores.shipmentCounter
  }

  save(
    tenantId: string,
    aggregate: PersistedShipmentRecord,
    options?: { expectedVersion?: number },
  ): PersistedShipmentRecord {
    const idx = this.stores.shipments.findIndex((s) => s.tenantId === tenantId && s.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.shipments[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('ShipmentRecord', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedShipmentRecord = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.shipments[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.shipments[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.shipments[idx] = next
    else this.stores.shipments.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.shipments.findIndex((s) => s.tenantId === tenantId && s.id === id)
    if (idx >= 0) {
      this.stores.shipments[idx] = {
        ...this.stores.shipments[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.shipments.some((s) => s.tenantId === tenantId && s.id === id && !s.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedShipmentRecord> {
    const rows = this.stores.shipments
      .filter((s) => s.tenantId === tenantId && !s.deletedAt)
      .sort((a, b) => b.shipmentNo.localeCompare(a.shipmentNo))
    return paginate(rows, page)
  }
}
