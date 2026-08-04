import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExportShipment } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExportShipmentRepository } from '@/domain/ports/persistence/aggregates/export-shipment.repository'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class ExportShipmentInMemoryRepository implements IExportShipmentRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedExportShipment | null {
    return (
      this.stores.exportShipments.find(
        (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedExportShipment | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedExportShipment | null {
    return this.findByExportShipmentNo(tenantId, code)
  }

  findByExportShipmentNo(
    tenantId: string,
    exportShipmentNo: string,
  ): PersistedExportShipment | null {
    return (
      this.stores.exportShipments.find(
        (e) =>
          e.tenantId === tenantId && e.exportShipmentNo === exportShipmentNo && !e.deletedAt,
      ) ?? null
    )
  }

  findByShipmentId(tenantId: string, shipmentId: string): PersistedExportShipment | null {
    return (
      this.stores.exportShipments.find(
        (e) => e.tenantId === tenantId && e.shipmentId === shipmentId && !e.deletedAt,
      ) ?? null
    )
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): PersistedExportShipment | null {
    return (
      this.stores.exportShipments.find(
        (e) => e.tenantId === tenantId && e.idempotencyKey === idempotencyKey && !e.deletedAt,
      ) ?? null
    )
  }

  nextExportShipmentCounter(): number {
    this.stores.exportShipmentCounter += 1
    return this.stores.exportShipmentCounter
  }

  save(
    tenantId: string,
    aggregate: PersistedExportShipment,
    options?: { expectedVersion?: number },
  ): PersistedExportShipment {
    const idx = this.stores.exportShipments.findIndex(
      (e) => e.tenantId === tenantId && e.id === aggregate.id,
    )
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.exportShipments[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError(
          'ExportShipment',
          aggregate.id,
          options.expectedVersion,
          current.version,
        )
      }
    }
    const now = new Date().toISOString()
    const next: PersistedExportShipment = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.exportShipments[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.exportShipments[idx]!.createdAt : aggregate.createdAt,
    }
    if (idx >= 0) this.stores.exportShipments[idx] = next
    else this.stores.exportShipments.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.exportShipments.findIndex((e) => e.tenantId === tenantId && e.id === id)
    if (idx >= 0) {
      this.stores.exportShipments[idx] = {
        ...this.stores.exportShipments[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.exportShipments.some(
      (e) => e.tenantId === tenantId && e.id === id && !e.deletedAt,
    )
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    _filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedExportShipment> {
    const rows = this.stores.exportShipments
      .filter((e) => e.tenantId === tenantId && !e.deletedAt)
      .sort((a, b) => b.exportShipmentNo.localeCompare(a.exportShipmentNo))
    return paginate(rows, page)
  }
}
