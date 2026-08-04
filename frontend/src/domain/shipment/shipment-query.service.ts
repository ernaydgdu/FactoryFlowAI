import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { PersistedShipmentRecord } from '@/domain/ports/persistence/persistence-aggregates'

import type { ShipmentRecord } from './shipment.types'

function strip(row: PersistedShipmentRecord): ShipmentRecord {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllShipments(): ShipmentRecord[] {
  const page = requireUnitOfWork().shipments.cursor(
    DEFAULT_TENANT_ID,
    {},
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(strip).sort((a, b) => b.shipmentNo.localeCompare(a.shipmentNo))
}

export function queryShipmentById(id: string): ShipmentRecord | null {
  const row = requireUnitOfWork().shipments.findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryShipmentsBySalesOrderId(salesOrderId: string): ShipmentRecord[] {
  return requireUnitOfWork()
    .shipments.findBySalesOrderId(DEFAULT_TENANT_ID, salesOrderId)
    .map(strip)
}

export function queryShipmentDashboard() {
  const lists = queryAllShipments()
  return {
    total: lists.length,
    draft: lists.filter((s) => s.status === 'Draft').length,
    booked: lists.filter((s) => s.status === 'Booked').length,
    inTransit: lists.filter((s) => s.status === 'InTransit' || s.status === 'Dispatched').length,
    delivered: lists.filter((s) => s.status === 'Delivered').length,
    closed: lists.filter((s) => s.status === 'Closed').length,
    totalQty: lists.reduce((s, r) => s + r.totals.totalQty, 0),
    totalCbm: Math.round(lists.reduce((s, r) => s + r.totals.volumeCbm, 0) * 10000) / 10000,
  }
}
