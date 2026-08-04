/**
 * ExportShipment orchestration CRUD.
 * Reuses Shipment / PackingList / ExportDocumentSet via queries only (no duplicate writes).
 */
import { queryAllExportDocumentSets } from '@/domain/commercial-documents/commercial-documents-query.service'
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { queryPackingListById } from '@/domain/packaging/packing-list-query.service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedExportShipment } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExportShipmentRepository } from '@/domain/ports/persistence/aggregates/export-shipment.repository'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { querySalesOrderById } from '@/domain/sales-order/sales-order-query.service'
import { queryShipmentById } from '@/domain/shipment/shipment-query.service'

import type {
  AssignContainerInput,
  ClearCustomsInput,
  ConfirmBookingInput,
  CreateExportShipmentInput,
  ExportGateCheck,
  ExportShipment,
  ExportShipmentStatus,
  ExportStatusLogEntry,
  TransitionExportShipmentInput,
} from './export-logistics.types'

export class ExportLogisticsDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExportLogisticsDomainError'
  }
}

function repo(): IExportShipmentRepository {
  return requireUnitOfWork().exportShipments
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function toDomain(row: PersistedExportShipment): ExportShipment {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function appendLog(
  list: ExportStatusLogEntry[],
  status: ExportShipmentStatus,
  actorUserId: string,
  note: string | null,
): ExportStatusLogEntry[] {
  return [
    ...list,
    {
      id: `esl-${Date.now()}-${list.length}`,
      status,
      occurredAt: new Date().toISOString(),
      actorUserId,
      note,
    },
  ]
}

/** Deterministic gate evaluation against Packing / Shipment / Commercial docs. */
export function evaluateExportGates(exportShipment: ExportShipment): ExportGateCheck[] {
  const shipment = queryShipmentById(exportShipment.shipmentId)
  const packingListId =
    exportShipment.packingListId ?? shipment?.packingListIds[0] ?? null
  const pl = packingListId ? queryPackingListById(packingListId) : null
  const docs = queryAllExportDocumentSets().filter(
    (d) => d.shipmentId === exportShipment.shipmentId,
  )
  const issuedInvoice = docs.find(
    (d) => d.commercialInvoice.status === 'Issued' || d.status === 'Issued',
  )
  const allDocsIssued =
    docs.length > 0 &&
    docs.every(
      (d) =>
        d.status === 'Issued' &&
        d.commercialInvoice.status === 'Issued' &&
        d.certificateOfOrigin.status === 'Issued' &&
        d.inspectionCertificate.status === 'Issued' &&
        d.billOfLadingReference.status === 'Issued' &&
        d.exportDeclaration.status === 'Issued',
    )

  const packingApproved =
    !!pl && (pl.status === 'Approved' || pl.approvalStatus === 'Approved' || pl.status === 'Confirmed')

  const weightOk =
    !!shipment &&
    !!pl &&
    Math.abs(pl.totals.netWeightKg - shipment.totals.netWeightKg) <= 0.001 &&
    Math.abs(pl.totals.grossWeightKg - shipment.totals.grossWeightKg) <= 0.001

  const cbmOk =
    !!shipment && !!pl && Math.abs(pl.totals.volumeCbm - shipment.totals.volumeCbm) <= 0.0001

  return [
    {
      code: 'COMMERCIAL_INVOICE_ISSUED',
      passed: !!issuedInvoice,
      detail: issuedInvoice
        ? issuedInvoice.commercialInvoice.invoiceNo
        : 'No Issued commercial invoice',
    },
    {
      code: 'PACKING_LIST_APPROVED',
      passed: packingApproved,
      detail: pl ? `${pl.packingListNo} status=${pl.status}/${pl.approvalStatus}` : 'PL missing',
    },
    {
      code: 'CONTAINER_ASSIGNED',
      passed: !!exportShipment.container?.containerNo,
      detail: exportShipment.container?.containerNo ?? 'No container',
    },
    {
      code: 'SEAL_NUMBER',
      passed: !!exportShipment.container?.sealNo,
      detail: exportShipment.container?.sealNo ?? 'No seal',
    },
    {
      code: 'BOOKING_CONFIRMED',
      passed: exportShipment.booking.confirmed && !!exportShipment.booking.bookingNo,
      detail: exportShipment.booking.confirmed
        ? exportShipment.booking.bookingNo
        : 'Booking not confirmed',
    },
    {
      code: 'WEIGHT_RECONCILE',
      passed: weightOk,
      detail: pl && shipment
        ? `plNet=${pl.totals.netWeightKg} shipNet=${shipment.totals.netWeightKg}`
        : 'Missing PL/Shipment',
    },
    {
      code: 'CBM_RECONCILE',
      passed: cbmOk,
      detail: pl && shipment
        ? `plCbm=${pl.totals.volumeCbm} shipCbm=${shipment.totals.volumeCbm}`
        : 'Missing PL/Shipment',
    },
    {
      code: 'CUSTOMS_CLEARED',
      passed: exportShipment.customsStatus === 'Cleared',
      detail: `customs=${exportShipment.customsStatus}`,
    },
    {
      code: 'ALL_EXPORT_DOCS_ISSUED',
      passed: allDocsIssued,
      detail: allDocsIssued ? `${docs.length} sets issued` : 'Export docs incomplete',
    },
  ]
}

export function computeDelayPrediction(exportShipment: ExportShipment, gates: ExportGateCheck[]): {
  riskFlags: string[]
  delayRiskScore: number
  predictedDelayDays: number
} {
  const riskFlags: string[] = []
  const failed = gates.filter((g) => !g.passed)
  for (const g of failed) riskFlags.push(g.code)

  if (!exportShipment.etd) riskFlags.push('MISSING_ETD')
  if (exportShipment.customsStatus === 'Held') riskFlags.push('CUSTOMS_HOLD')
  if (exportShipment.customsStatus === 'Rejected') riskFlags.push('CUSTOMS_REJECTED')

  let score = Math.min(100, failed.length * 12 + (exportShipment.customsStatus === 'Held' ? 25 : 0))
  if (!exportShipment.etd) score = Math.min(100, score + 10)
  if (exportShipment.eta && exportShipment.etd) {
    const etd = Date.parse(exportShipment.etd)
    const eta = Date.parse(exportShipment.eta)
    if (Number.isFinite(etd) && Number.isFinite(eta) && eta - etd > 21 * 86400000) {
      riskFlags.push('LONG_TRANSIT')
      score = Math.min(100, score + 8)
    }
  }

  const predictedDelayDays = Math.round((score / 100) * 7 * 10) / 10
  return { riskFlags, delayRiskScore: score, predictedDelayDays }
}

function refreshDerived(exportShipment: ExportShipment): ExportShipment {
  const gateChecks = evaluateExportGates(exportShipment)
  const pred = computeDelayPrediction(exportShipment, gateChecks)
  return { ...exportShipment, gateChecks, ...pred }
}

function persist(
  shipment: ExportShipment,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): ExportShipment {
  const refreshed = refreshDerived(shipment)
  const now = new Date().toISOString()
  const persisted: PersistedExportShipment = {
    ...refreshed,
    updatedAt: now,
    tenantId: DEFAULT_TENANT_ID,
    version: expectedVersion ?? 1,
    schemaVersion: 1,
    deletedAt: null,
  }
  const order = querySalesOrderById(refreshed.salesOrderId)
  const saved = repo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion != null ? expectedVersion : undefined,
  })
  logAudit(
    'ExportShipment',
    saved.id,
    changeType === 'CreateExportShipment' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.exportShipmentNo} — ${changeType}` },
    null,
    {
      exportShipmentNo: saved.exportShipmentNo,
      status: saved.status,
      customsStatus: saved.customsStatus,
      delayRiskScore: saved.delayRiskScore,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-exs-${saved.id}-${Date.now()}`,
    entityType: 'SALES_ORDER',
    entityId: saved.salesOrderId,
    entityCode: saved.salesOrderNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.exportShipmentNo} · ${saved.status}`,
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

function requireExport(id: string): PersistedExportShipment {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new ExportLogisticsDomainError(`Export shipment bulunamadı: ${id}`)
  return row
}

const ALLOWED: Record<ExportShipmentStatus, ExportShipmentStatus[]> = {
  Planning: ['Booked', 'Cancelled'],
  Booked: ['ContainerAssigned', 'Cancelled'],
  ContainerAssigned: ['DocumentsComplete', 'Cancelled'],
  DocumentsComplete: ['CustomsCleared', 'Cancelled'],
  CustomsCleared: ['Loaded', 'Cancelled'],
  Loaded: ['Departed', 'Cancelled'],
  Departed: ['Arrived'],
  Arrived: ['Closed'],
  Closed: [],
  Cancelled: [],
}

function requireLoadGates(gates: ExportGateCheck[]): void {
  const required = [
    'COMMERCIAL_INVOICE_ISSUED',
    'PACKING_LIST_APPROVED',
    'CONTAINER_ASSIGNED',
    'WEIGHT_RECONCILE',
    'CBM_RECONCILE',
    'SEAL_NUMBER',
    'BOOKING_CONFIRMED',
  ]
  for (const code of required) {
    const g = gates.find((x) => x.code === code)
    if (!g?.passed) {
      throw new ExportLogisticsDomainError(`Load engellendi: ${code} — ${g?.detail ?? 'fail'}`)
    }
  }
}

export function persistCreateExportShipment(
  input: CreateExportShipmentInput,
  actorUserId: string,
): ExportShipment {
  if (!input.idempotencyKey?.trim()) {
    throw new ExportLogisticsDomainError('idempotencyKey zorunlu.')
  }
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const byShip = repo().findByShipmentId(DEFAULT_TENANT_ID, input.shipmentId)
  if (byShip) return toDomain(byShip)

  const shipment = queryShipmentById(input.shipmentId)
  if (!shipment) throw new ExportLogisticsDomainError(`Shipment bulunamadı: ${input.shipmentId}`)

  const packingListId = shipment.packingListIds[0] ?? null
  const docs = queryAllExportDocumentSets().filter((d) => d.shipmentId === shipment.id)
  const now = new Date().toISOString()
  const created: ExportShipment = {
    id: `exs-${input.idempotencyKey}`,
    exportShipmentNo: `EXS-2026-${String(repo().nextExportShipmentCounter()).padStart(4, '0')}`,
    salesOrderId: shipment.salesOrderId,
    salesOrderNo: shipment.salesOrderNo,
    shipmentId: shipment.id,
    shipmentNo: shipment.shipmentNo,
    packingListId,
    exportDocumentSetId: docs[0]?.id ?? null,
    status: 'Planning',
    customsStatus: 'Pending',
    booking: {
      bookingNo: shipment.bookingNo ?? '',
      confirmed: false,
      confirmedAt: null,
    },
    container: shipment.containerNo
      ? {
          containerNo: shipment.containerNo,
          containerType: shipment.containerType ?? '40HC',
          sealNo: shipment.sealNo,
          assignedAt: null,
        }
      : null,
    carrier: { carrierCode: null, carrierName: null },
    forwarder: {
      forwarderCode: shipment.forwarderCode,
      forwarderName: null,
    },
    voyage: {
      vesselName: shipment.vesselName,
      voyageNo: shipment.voyageNo,
    },
    portOfLoading: shipment.portOfLoading,
    portOfDischarge: shipment.portOfDischarge,
    etd: shipment.etd,
    eta: shipment.eta,
    dispatchConfirmedAt: null,
    gateChecks: [],
    statusLog: appendLog([], 'Planning', actorUserId, 'Orchestration created'),
    riskFlags: [],
    delayRiskScore: 0,
    predictedDelayDays: 0,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(created, actorUserId, 'CreateExportShipment')
}

export function persistConfirmBooking(
  input: ConfirmBookingInput,
  actorUserId: string,
): ExportShipment {
  if (!input.idempotencyKey?.trim()) {
    throw new ExportLogisticsDomainError('idempotencyKey zorunlu.')
  }
  if (!input.bookingNo.trim()) throw new ExportLogisticsDomainError('bookingNo zorunlu.')
  const row = requireExport(input.exportShipmentId)
  const current = toDomain(row)
  if (current.status === 'Closed' || current.status === 'Cancelled') {
    throw new ExportLogisticsDomainError(`Booking güncellenemez — ${current.status}`)
  }
  const now = new Date().toISOString()
  const next: ExportShipment = {
    ...current,
    booking: {
      bookingNo: input.bookingNo.trim(),
      confirmed: true,
      confirmedAt: now,
    },
    carrier: {
      carrierCode: input.carrierCode ?? current.carrier.carrierCode,
      carrierName: input.carrierName ?? current.carrier.carrierName,
    },
    forwarder: {
      forwarderCode: input.forwarderCode ?? current.forwarder.forwarderCode,
      forwarderName: input.forwarderName ?? current.forwarder.forwarderName,
    },
    voyage: {
      vesselName: input.vesselName ?? current.voyage.vesselName,
      voyageNo: input.voyageNo ?? current.voyage.voyageNo,
    },
    portOfLoading: input.portOfLoading ?? current.portOfLoading,
    portOfDischarge: input.portOfDischarge ?? current.portOfDischarge,
    etd: input.etd ?? current.etd,
    eta: input.eta ?? current.eta,
    status: current.status === 'Planning' ? 'Booked' : current.status,
    statusLog:
      current.status === 'Planning'
        ? appendLog(current.statusLog, 'Booked', actorUserId, 'Booking confirmed')
        : current.statusLog,
    idempotencyKey: `bk-${input.idempotencyKey}`,
  }
  return persist(next, actorUserId, 'ConfirmExportBooking', row.version)
}

export function persistAssignContainer(
  input: AssignContainerInput,
  actorUserId: string,
): ExportShipment {
  if (!input.idempotencyKey?.trim()) {
    throw new ExportLogisticsDomainError('idempotencyKey zorunlu.')
  }
  if (!input.containerNo.trim() || !input.sealNo.trim()) {
    throw new ExportLogisticsDomainError('containerNo ve sealNo zorunlu.')
  }
  const row = requireExport(input.exportShipmentId)
  const current = toDomain(row)
  if (!current.booking.confirmed) {
    throw new ExportLogisticsDomainError('Container ataması için booking confirmed gerekli.')
  }
  const now = new Date().toISOString()
  const next: ExportShipment = {
    ...current,
    container: {
      containerNo: input.containerNo.trim().toUpperCase(),
      containerType: input.containerType.trim() || '40HC',
      sealNo: input.sealNo.trim(),
      assignedAt: now,
    },
    status:
      current.status === 'Booked' || current.status === 'Planning'
        ? 'ContainerAssigned'
        : current.status,
    statusLog:
      current.status === 'Booked' || current.status === 'Planning'
        ? appendLog(current.statusLog, 'ContainerAssigned', actorUserId, input.containerNo)
        : current.statusLog,
    idempotencyKey: `ctr-${input.idempotencyKey}`,
  }
  return persist(next, actorUserId, 'AssignExportContainer', row.version)
}

export function persistClearCustoms(
  input: ClearCustomsInput,
  actorUserId: string,
): ExportShipment {
  if (!input.idempotencyKey?.trim()) {
    throw new ExportLogisticsDomainError('idempotencyKey zorunlu.')
  }
  const row = requireExport(input.exportShipmentId)
  const current = toDomain(row)
  const gates = evaluateExportGates(current)
  const docsOk = gates.find((g) => g.code === 'ALL_EXPORT_DOCS_ISSUED' || g.code === 'COMMERCIAL_INVOICE_ISSUED')
  // Customs clear requires at least commercial invoice issued; prefer DocumentsComplete path
  if (current.status !== 'DocumentsComplete' && current.status !== 'CustomsCleared') {
    // Allow marking docs complete first if invoice issued
    const inv = gates.find((g) => g.code === 'COMMERCIAL_INVOICE_ISSUED')
    if (!inv?.passed) {
      throw new ExportLogisticsDomainError('Customs için Issued Commercial Invoice gerekli.')
    }
  }
  let status = current.status
  let statusLog = current.statusLog
  if (current.status === 'ContainerAssigned' || current.status === 'Booked') {
    status = 'DocumentsComplete'
    statusLog = appendLog(statusLog, 'DocumentsComplete', actorUserId, 'Docs gate')
  }
  if (status === 'DocumentsComplete') {
    status = 'CustomsCleared'
    statusLog = appendLog(statusLog, 'CustomsCleared', actorUserId, input.note ?? 'Cleared')
  }
  void docsOk
  return persist(
    {
      ...current,
      status,
      statusLog,
      customsStatus: 'Cleared',
      idempotencyKey: `cus-${input.idempotencyKey}`,
    },
    actorUserId,
    'ClearExportCustoms',
    row.version,
  )
}

export function persistTransitionExportShipment(
  input: TransitionExportShipmentInput,
  actorUserId: string,
): ExportShipment {
  if (!input.idempotencyKey?.trim()) {
    throw new ExportLogisticsDomainError('idempotencyKey zorunlu.')
  }
  const row = requireExport(input.exportShipmentId)
  const current = toDomain(row)
  if (current.status === input.toStatus) return current

  const allowed = ALLOWED[current.status] ?? []
  if (!allowed.includes(input.toStatus)) {
    throw new ExportLogisticsDomainError(`${current.status} → ${input.toStatus} yasak.`)
  }

  const gates = evaluateExportGates(current)

  if (input.toStatus === 'DocumentsComplete') {
    const inv = gates.find((g) => g.code === 'COMMERCIAL_INVOICE_ISSUED')
    if (!inv?.passed) {
      throw new ExportLogisticsDomainError('DocumentsComplete için Issued Commercial Invoice gerekli.')
    }
  }

  if (input.toStatus === 'CustomsCleared') {
    if (current.customsStatus !== 'Cleared' && input.toStatus === 'CustomsCleared') {
      // transition alone can set cleared when coming from DocumentsComplete
    }
  }

  if (input.toStatus === 'Loaded') {
    requireLoadGates(gates)
    if (current.customsStatus !== 'Cleared') {
      throw new ExportLogisticsDomainError('Load için customs clearance gerekli.')
    }
  }

  if (input.toStatus === 'Departed') {
    if (current.customsStatus !== 'Cleared') {
      throw new ExportLogisticsDomainError('Depart için customs clearance gerekli.')
    }
    if (current.status !== 'Loaded') {
      throw new ExportLogisticsDomainError('Depart için Loaded gerekli.')
    }
  }

  if (input.toStatus === 'Closed') {
    const allDocs = gates.find((g) => g.code === 'ALL_EXPORT_DOCS_ISSUED')
    if (!allDocs?.passed) {
      throw new ExportLogisticsDomainError('Close için tüm export dokümanları Issued olmalı.')
    }
  }

  const now = new Date().toISOString()
  return persist(
    {
      ...current,
      status: input.toStatus,
      customsStatus:
        input.toStatus === 'CustomsCleared' ? 'Cleared' : current.customsStatus,
      dispatchConfirmedAt:
        input.toStatus === 'Loaded' || input.toStatus === 'Departed'
          ? current.dispatchConfirmedAt ?? now
          : current.dispatchConfirmedAt,
      statusLog: appendLog(current.statusLog, input.toStatus, actorUserId, input.note ?? null),
      idempotencyKey: `tr-${input.idempotencyKey}`,
    },
    actorUserId,
    'TransitionExportShipment',
    row.version,
  )
}
