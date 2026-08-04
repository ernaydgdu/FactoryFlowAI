import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPackingList } from '@/domain/ports/persistence/persistence-aggregates'
import { encodeGs1128Skeleton } from '@/domain/barcode-mobile/barcode-codec.service'

import type { PackagingBrainReadModel, PackingList } from './packaging.types'

function strip(row: PersistedPackingList): PackingList {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return {
    ...rest,
    revision: rest.revision ?? 1,
    previousRevisionId: rest.previousRevisionId ?? null,
    approvalStatus: rest.approvalStatus ?? 'None',
    approvedBy: rest.approvedBy ?? null,
    approvedAt: rest.approvedAt ?? null,
    containerCode: rest.containerCode ?? null,
    packages: (rest.packages ?? []).map((p) => ({
      ...p,
      gs1128:
        p.gs1128 ??
        encodeGs1128Skeleton({
          sscc: p.sscc,
          qty: p.lines.reduce((s, l) => s + l.quantity, 0),
        }),
      parentPackageId: p.parentPackageId ?? null,
      containerCode: p.containerCode ?? null,
    })),
  }
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
    confirmed: lists.filter((l) => l.status === 'Confirmed' || l.status === 'Approved').length,
    shipped: lists.filter((l) => l.status === 'Shipped').length,
    pendingApproval: lists.filter((l) => l.status === 'PendingApproval').length,
    totalPackages: lists.reduce((s, l) => s + l.totals.packageCount, 0),
    totalQty: lists.reduce((s, l) => s + l.totals.totalQty, 0),
    totalCbm: Math.round(lists.reduce((s, l) => s + l.totals.volumeCbm, 0) * 10000) / 10000,
  }
}

/** Brain / Copilot read surface — deterministic, side-effect free. */
export function queryPackagingBrainReadModel(salesOrderId?: string): PackagingBrainReadModel {
  const lists = salesOrderId
    ? queryPackingListsBySalesOrderId(salesOrderId)
    : queryAllPackingLists()
  return {
    salesOrderId: salesOrderId ?? null,
    packingListCount: lists.length,
    confirmedOrApproved: lists.filter(
      (l) => l.status === 'Confirmed' || l.status === 'Approved',
    ).length,
    pendingApproval: lists.filter((l) => l.status === 'PendingApproval').length,
    shipped: lists.filter((l) => l.status === 'Shipped').length,
    totalPackages: lists.reduce((s, l) => s + l.totals.packageCount, 0),
    totalQty: lists.reduce((s, l) => s + l.totals.totalQty, 0),
    totalCbm: Math.round(lists.reduce((s, l) => s + l.totals.volumeCbm, 0) * 10000) / 10000,
    openValidationErrors: lists.reduce((s, l) => s + l.validationErrors.length, 0),
    lists: lists.map((l) => ({
      id: l.id,
      packingListNo: l.packingListNo,
      status: l.status,
      revision: l.revision,
      approvalStatus: l.approvalStatus,
      packageCount: l.totals.packageCount,
      totalQty: l.totals.totalQty,
      volumeCbm: l.totals.volumeCbm,
      containerCode: l.containerCode,
      shipmentReferenceNo: l.shipmentReferenceNo,
    })),
  }
}
