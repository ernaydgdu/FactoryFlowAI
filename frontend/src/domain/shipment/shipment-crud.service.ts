/**
 * ShipmentRecord CRUD — transactional logistics SSOT.
 * Stock outbound reuses persistShipment only (Architecture Freeze).
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { persistShipment } from '@/domain/inventory/stock-ledger-crud.service'
import { queryPackingListById } from '@/domain/packaging/packing-list-query.service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedShipmentRecord } from '@/domain/ports/persistence/persistence-aggregates'
import type { IShipmentRepository } from '@/domain/ports/persistence/aggregates/shipment.repository'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { querySalesOrderById } from '@/domain/sales-order/sales-order-query.service'

import type {
  AddLoadFromPackingListInput,
  CreateShipmentInput,
  PostShipmentInventoryInput,
  ShipmentLoadLine,
  ShipmentRecord,
  ShipmentStatus,
  ShipmentStatusLogEntry,
  TransitionShipmentInput,
  UpdateShipmentLogisticsInput,
} from './shipment.types'

export class ShipmentDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShipmentDomainError'
  }
}

function repo(): IShipmentRepository {
  return requireUnitOfWork().shipments
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function emptyTotals(): ShipmentRecord['totals'] {
  return { packageCount: 0, totalQty: 0, netWeightKg: 0, grossWeightKg: 0, volumeCbm: 0 }
}

function recomputeTotals(lines: ShipmentLoadLine[]): ShipmentRecord['totals'] {
  return {
    packageCount: lines.length,
    totalQty: lines.reduce((s, l) => s + l.quantity, 0),
    netWeightKg: Math.round(lines.reduce((s, l) => s + l.netWeightKg, 0) * 1000) / 1000,
    grossWeightKg: Math.round(lines.reduce((s, l) => s + l.grossWeightKg, 0) * 1000) / 1000,
    volumeCbm: Math.round(lines.reduce((s, l) => s + l.volumeCbm, 0) * 10000) / 10000,
  }
}

function toDomain(row: PersistedShipmentRecord): ShipmentRecord {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function nextShipmentNo(): string {
  return `SH-2026-${String(repo().nextShipmentCounter()).padStart(4, '0')}`
}

function appendLog(
  list: ShipmentStatusLogEntry[],
  status: ShipmentStatus,
  actorUserId: string,
  note: string | null,
): ShipmentStatusLogEntry[] {
  return [
    ...list,
    {
      id: `ssl-${Date.now()}-${list.length}`,
      status,
      occurredAt: new Date().toISOString(),
      actorUserId,
      note,
    },
  ]
}

function persist(
  shipment: ShipmentRecord,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): ShipmentRecord {
  const now = new Date().toISOString()
  const persisted: PersistedShipmentRecord = {
    ...shipment,
    updatedAt: now,
    tenantId: DEFAULT_TENANT_ID,
    version: expectedVersion ?? 1,
    schemaVersion: 1,
    deletedAt: null,
  }
  const order = querySalesOrderById(shipment.salesOrderId)
  const saved = repo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion != null ? expectedVersion : undefined,
  })
  logAudit(
    'ShipmentRecord',
    saved.id,
    changeType === 'CreateShipment' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.shipmentNo} — ${changeType}` },
    null,
    {
      shipmentNo: saved.shipmentNo,
      status: saved.status,
      packageCount: saved.totals.packageCount,
      totalQty: saved.totals.totalQty,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-sh-${saved.id}-${Date.now()}`,
    entityType: 'SALES_ORDER',
    entityId: saved.salesOrderId,
    entityCode: saved.salesOrderNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.shipmentNo} · ${saved.status}`,
  })
  scheduleSalesOrderChange({
    salesOrderId: saved.salesOrderId,
    orderNo: saved.salesOrderNo,
    status: saved.status,
    productCardId: order?.productCardId ?? 'n/a',
    changeType,
    occurredAt: now,
    actorUserId,
  })
  return toDomain(saved)
}

function requireShipment(id: string): PersistedShipmentRecord {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new ShipmentDomainError(`Shipment bulunamadı: ${id}`)
  return row
}

const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  Draft: ['Booked', 'Cancelled'],
  Booked: ['Loaded', 'Cancelled'],
  Loaded: ['Dispatched', 'Cancelled'],
  Dispatched: ['InTransit', 'Delivered', 'Closed'],
  InTransit: ['Delivered', 'Closed'],
  Delivered: ['Closed'],
  Closed: [],
  Cancelled: [],
}

export function persistCreateShipment(
  input: CreateShipmentInput,
  actorUserId: string,
): ShipmentRecord {
  if (!input.idempotencyKey?.trim()) throw new ShipmentDomainError('idempotencyKey zorunlu.')
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const order = querySalesOrderById(input.salesOrderId)
  if (!order) throw new ShipmentDomainError(`Sales order bulunamadı: ${input.salesOrderId}`)

  let packingListIds: string[] = []
  let inventoryReferenceNo: string | null = null
  let shipmentMovementId: string | null = null
  let loadLines: ShipmentLoadLine[] = []
  let documentLinks: ShipmentRecord['documentLinks'] = []
  let warehouseCode = input.warehouseCode ?? null

  if (input.packingListId) {
    const pl = queryPackingListById(input.packingListId)
    if (!pl) throw new ShipmentDomainError(`Packing list bulunamadı: ${input.packingListId}`)
    if (pl.salesOrderId !== order.id) {
      throw new ShipmentDomainError('Packing list sipariş ile uyuşmuyor.')
    }
    packingListIds = [pl.id]
    warehouseCode = warehouseCode ?? pl.warehouseCode
    inventoryReferenceNo = pl.shipmentReferenceNo
    shipmentMovementId = pl.shipmentMovementId
    documentLinks = [
      {
        id: `sdl-pl-${pl.id}`,
        documentType: 'PACKING_LIST',
        reference: pl.packingListNo,
        linkedAt: new Date().toISOString(),
      },
    ]
  }

  const now = new Date().toISOString()
  const status: ShipmentStatus = 'Draft'
  const shipment: ShipmentRecord = {
    id: `sh-${input.idempotencyKey}`,
    shipmentNo: nextShipmentNo(),
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    packingListIds,
    status,
    statusLog: appendLog([], status, actorUserId, 'Created'),
    bookingNo: input.bookingNo ?? null,
    containerNo: input.containerNo ?? null,
    containerType: input.containerType ?? null,
    sealNo: input.sealNo ?? null,
    vesselName: input.vesselName ?? null,
    voyageNo: input.voyageNo ?? null,
    portOfLoading: input.portOfLoading ?? null,
    portOfDischarge: input.portOfDischarge ?? null,
    etd: input.etd ?? null,
    eta: input.eta ?? null,
    forwarderCode: input.forwarderCode ?? null,
    warehouseCode,
    loadLines,
    documentLinks,
    totals: emptyTotals(),
    inventoryReferenceNo,
    shipmentMovementId,
    closedAt: null,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(shipment, actorUserId, 'CreateShipment')
}

export function persistUpdateShipmentLogistics(
  input: UpdateShipmentLogisticsInput,
  actorUserId: string,
): ShipmentRecord {
  if (!input.idempotencyKey?.trim()) throw new ShipmentDomainError('idempotencyKey zorunlu.')
  const row = requireShipment(input.shipmentId)
  const current = toDomain(row)
  if (current.status === 'Closed' || current.status === 'Cancelled') {
    throw new ShipmentDomainError(`Lojistik güncellenemez — durum: ${current.status}`)
  }
  const next: ShipmentRecord = {
    ...current,
    bookingNo: input.bookingNo !== undefined ? input.bookingNo || null : current.bookingNo,
    containerNo: input.containerNo !== undefined ? input.containerNo || null : current.containerNo,
    containerType:
      input.containerType !== undefined ? input.containerType || null : current.containerType,
    sealNo: input.sealNo !== undefined ? input.sealNo || null : current.sealNo,
    vesselName: input.vesselName !== undefined ? input.vesselName || null : current.vesselName,
    voyageNo: input.voyageNo !== undefined ? input.voyageNo || null : current.voyageNo,
    portOfLoading:
      input.portOfLoading !== undefined ? input.portOfLoading || null : current.portOfLoading,
    portOfDischarge:
      input.portOfDischarge !== undefined ? input.portOfDischarge || null : current.portOfDischarge,
    etd: input.etd !== undefined ? input.etd || null : current.etd,
    eta: input.eta !== undefined ? input.eta || null : current.eta,
    forwarderCode:
      input.forwarderCode !== undefined ? input.forwarderCode || null : current.forwarderCode,
    idempotencyKey: `log-${input.idempotencyKey}`,
  }
  if (!next.bookingNo && next.status === 'Draft') {
    /* booking optional until Booked */
  }
  return persist(next, actorUserId, 'UpdateShipmentLogistics', row.version)
}

export function persistAddLoadFromPackingList(
  input: AddLoadFromPackingListInput,
  actorUserId: string,
): ShipmentRecord {
  if (!input.idempotencyKey?.trim()) throw new ShipmentDomainError('idempotencyKey zorunlu.')
  const row = requireShipment(input.shipmentId)
  const current = toDomain(row)
  if (current.status === 'Closed' || current.status === 'Cancelled' || current.status === 'Delivered') {
    throw new ShipmentDomainError(`Yükleme eklenemez — durum: ${current.status}`)
  }
  const pl = queryPackingListById(input.packingListId)
  if (!pl) throw new ShipmentDomainError(`Packing list bulunamadı: ${input.packingListId}`)
  if (pl.salesOrderId !== current.salesOrderId) {
    throw new ShipmentDomainError('Packing list sipariş ile uyuşmuyor.')
  }

  const packages = pl.packages.filter((p) =>
    input.packageIds?.length ? input.packageIds.includes(p.id) : true,
  )
  if (!packages.length) throw new ShipmentDomainError('Yüklenecek paket yok.')

  const existingIds = new Set(current.loadLines.map((l) => l.packageId))
  const additions: ShipmentLoadLine[] = []
  for (const pkg of packages) {
    if (existingIds.has(pkg.id)) continue
    additions.push({
      id: `sll-${input.idempotencyKey}-${pkg.id}`,
      packingListId: pl.id,
      packingListNo: pl.packingListNo,
      packageId: pkg.id,
      packageNo: pkg.packageNo,
      sscc: pkg.sscc,
      quantity: pkg.lines.reduce((s, l) => s + l.quantity, 0),
      netWeightKg: pkg.netWeightKg,
      grossWeightKg: pkg.grossWeightKg,
      volumeCbm: pkg.volumeCbm,
    })
  }
  if (!additions.length) return current

  const loadLines = [...current.loadLines, ...additions]
  const packingListIds = current.packingListIds.includes(pl.id)
    ? current.packingListIds
    : [...current.packingListIds, pl.id]
  const documentLinks = current.documentLinks.some((d) => d.reference === pl.packingListNo)
    ? current.documentLinks
    : [
        ...current.documentLinks,
        {
          id: `sdl-pl-${pl.id}`,
          documentType: 'PACKING_LIST' as const,
          reference: pl.packingListNo,
          linkedAt: new Date().toISOString(),
        },
      ]

  return persist(
    {
      ...current,
      packingListIds,
      loadLines,
      documentLinks,
      totals: recomputeTotals(loadLines),
      warehouseCode: current.warehouseCode ?? pl.warehouseCode,
      inventoryReferenceNo: current.inventoryReferenceNo ?? pl.shipmentReferenceNo,
      shipmentMovementId: current.shipmentMovementId ?? pl.shipmentMovementId,
      status: current.status === 'Draft' || current.status === 'Booked' ? 'Loaded' : current.status,
      statusLog:
        current.status === 'Draft' || current.status === 'Booked'
          ? appendLog(current.statusLog, 'Loaded', actorUserId, `Load from ${pl.packingListNo}`)
          : current.statusLog,
      idempotencyKey: `load-${input.idempotencyKey}`,
    },
    actorUserId,
    'AddLoadFromPackingList',
    row.version,
  )
}

export function persistTransitionShipment(
  input: TransitionShipmentInput,
  actorUserId: string,
): ShipmentRecord {
  if (!input.idempotencyKey?.trim()) throw new ShipmentDomainError('idempotencyKey zorunlu.')
  const row = requireShipment(input.shipmentId)
  const current = toDomain(row)
  if (current.status === input.toStatus) return current
  const allowed = ALLOWED[current.status] ?? []
  if (!allowed.includes(input.toStatus)) {
    throw new ShipmentDomainError(`${current.status} → ${input.toStatus} geçişi yasak.`)
  }
  if (input.toStatus === 'Booked' && !current.bookingNo) {
    throw new ShipmentDomainError('Booked için bookingNo gerekli.')
  }
  if (
    (input.toStatus === 'Loaded' || input.toStatus === 'Dispatched') &&
    current.loadLines.length === 0
  ) {
    throw new ShipmentDomainError('Yük satırı olmadan Loaded/Dispatched olamaz.')
  }
  if (input.toStatus === 'Booked' && (!current.portOfLoading || !current.portOfDischarge)) {
    throw new ShipmentDomainError('Booked için POL/POD gerekli.')
  }

  const closedAt = input.toStatus === 'Closed' ? new Date().toISOString() : current.closedAt
  return persist(
    {
      ...current,
      status: input.toStatus,
      statusLog: appendLog(current.statusLog, input.toStatus, actorUserId, input.note ?? null),
      closedAt,
      idempotencyKey: `tr-${input.idempotencyKey}`,
    },
    actorUserId,
    'TransitionShipment',
    row.version,
  )
}

/**
 * Post inventory once via persistShipment — never duplicates if already linked
 * (e.g. PackingList.bindShipment already posted).
 */
export function persistPostShipmentInventory(
  input: PostShipmentInventoryInput,
  actorUserId: string,
): ShipmentRecord {
  if (!input.idempotencyKey?.trim()) throw new ShipmentDomainError('idempotencyKey zorunlu.')
  const row = requireShipment(input.shipmentId)
  const current = toDomain(row)
  if (current.inventoryReferenceNo && current.shipmentMovementId) {
    return current
  }
  if (current.totals.totalQty <= 0) {
    throw new ShipmentDomainError('Stok çıkışı için yük miktarı > 0 olmalı.')
  }
  if (current.status === 'Cancelled' || current.status === 'Draft') {
    throw new ShipmentDomainError('Stok çıkışı için en az Loaded/Booked sonrası gerekli.')
  }

  const result = persistShipment(
    {
      stockCardId: input.stockCardId ?? `fg-${current.salesOrderNo}`,
      warehouseCode: input.warehouseCode,
      quantity: current.totals.totalQty,
      referenceId: current.id,
      referenceNo: input.idempotencyKey,
      reason: `Shipment dispatch — ${current.shipmentNo}`,
    },
    actorUserId,
  )

  return persist(
    {
      ...current,
      warehouseCode: input.warehouseCode,
      inventoryReferenceNo: input.idempotencyKey,
      shipmentMovementId: result.movement.id,
      status:
        current.status === 'Loaded' || current.status === 'Booked' ? 'Dispatched' : current.status,
      statusLog:
        current.status === 'Loaded' || current.status === 'Booked'
          ? appendLog(current.statusLog, 'Dispatched', actorUserId, 'Inventory posted')
          : current.statusLog,
      idempotencyKey: `inv-${input.idempotencyKey}`,
    },
    actorUserId,
    'PostShipmentInventory',
    row.version,
  )
}
