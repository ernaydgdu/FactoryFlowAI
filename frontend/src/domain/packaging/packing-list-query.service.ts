import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPackingList } from '@/domain/ports/persistence/persistence-aggregates'

import type { PackingList } from './packaging.types'

function strip(row: PersistedPackingList): PackingList {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllPackingLists(): PackingList[] {
  const page = requireUnitOfWork().packingLists.cursor(
    DEFAULT_TENANT_ID,
    {},
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(strip).sort((a, b) => b.packingListNo.localeCompare(a.packingListNo))
}

export function queryPackingListById(id: string): PackingList | null {
  const row = requireUnitOfWork().packingLists.findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryPackingListsBySalesOrderId(salesOrderId: string): PackingList[] {
  return requireUnitOfWork()
    .packingLists.findBySalesOrderId(DEFAULT_TENANT_ID, salesOrderId)
    .map(strip)
}

export function queryPackagingDashboard() {
  const lists = queryAllPackingLists()
  return {
    totalLists: lists.length,
    draft: lists.filter((l) => l.status === 'Draft').length,
    confirmed: lists.filter((l) => l.status === 'Confirmed').length,
    shipped: lists.filter((l) => l.status === 'Shipped').length,
    totalPackages: lists.reduce((s, l) => s + l.totals.packageCount, 0),
    totalQty: lists.reduce((s, l) => s + l.totals.totalQty, 0),
    totalCbm: Math.round(lists.reduce((s, l) => s + l.totals.volumeCbm, 0) * 10000) / 10000,
  }
}
