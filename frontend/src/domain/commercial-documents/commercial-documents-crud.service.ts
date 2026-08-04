/**
 * Export Document Set + Commercial Invoice CRUD.
 * Reads Shipment + PackingList via existing query services (no duplicate write paths).
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { queryPackingListById } from '@/domain/packaging/packing-list-query.service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedExportDocumentSet } from '@/domain/ports/persistence/persistence-aggregates'
import type { IExportDocumentSetRepository } from '@/domain/ports/persistence/aggregates/export-document-set.repository'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { querySalesOrderById } from '@/domain/sales-order/sales-order-query.service'
import { queryShipmentById } from '@/domain/shipment/shipment-query.service'
import type { ShipmentStatus } from '@/domain/shipment/shipment.types'

import type {
  AttachDocumentInput,
  CommercialDocumentValidationResult,
  CommercialInvoice,
  CommercialInvoiceLine,
  CreateExportDocumentSetInput,
  DocumentLifecycleStatus,
  ExportDocumentSet,
  ReviseDocumentSetInput,
  TransitionDocumentSetInput,
} from './commercial-documents.types'

export class CommercialDocumentsDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommercialDocumentsDomainError'
  }
}

/** Shipment statuses accepted as logistics-approved for commercial invoice generation. */
const SHIPMENT_APPROVED_STATUSES: ShipmentStatus[] = [
  'Booked',
  'Loaded',
  'Dispatched',
  'InTransit',
  'Delivered',
  'Closed',
]

function repo(): IExportDocumentSetRepository {
  return requireUnitOfWork().exportDocumentSets
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function toDomain(row: PersistedExportDocumentSet): ExportDocumentSet {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

function assertWritable(set: ExportDocumentSet): void {
  if (set.status === 'Issued' || set.status === 'Archived') {
    throw new CommercialDocumentsDomainError(
      `Doküman salt-okunur — durum: ${set.status}`,
    )
  }
}

function snapshot(set: ExportDocumentSet): string {
  return JSON.stringify({
    status: set.status,
    invoice: set.commercialInvoice,
    packingListReference: set.packingListReference,
    certificateOfOrigin: set.certificateOfOrigin,
    inspectionCertificate: set.inspectionCertificate,
    billOfLadingReference: set.billOfLadingReference,
    exportDeclaration: set.exportDeclaration,
    totals: {
      qty: set.commercialInvoice.totalQty,
      amount: set.commercialInvoice.totalAmount,
      cbm: set.commercialInvoice.volumeCbm,
    },
  })
}

export function validateExportDocumentSet(set: ExportDocumentSet): CommercialDocumentValidationResult {
  const checks: CommercialDocumentValidationResult['checks'] = []
  const errors: string[] = []

  const shipment = queryShipmentById(set.shipmentId)
  const pl = queryPackingListById(set.packingListId)

  const plExists = !!pl
  checks.push({
    code: 'PACKING_LIST_EXISTS',
    passed: plExists,
    detail: plExists ? set.packingListReference.packingListNo : 'Packing list missing',
  })
  if (!plExists) errors.push('Packing list zorunlu.')

  const shipOk = !!shipment && SHIPMENT_APPROVED_STATUSES.includes(shipment.status)
  checks.push({
    code: 'SHIPMENT_APPROVED',
    passed: shipOk,
    detail: shipment ? `status=${shipment.status}` : 'Shipment missing',
  })
  if (!shipOk) errors.push('Commercial Invoice yalnızca Approved (Booked+) Shipment üzerinden.')

  if (pl) {
    const qtyMatch = set.commercialInvoice.totalQty === pl.totals.totalQty
    checks.push({
      code: 'QTY_MATCH_PL',
      passed: qtyMatch,
      detail: `invoice=${set.commercialInvoice.totalQty} pl=${pl.totals.totalQty}`,
    })
    if (!qtyMatch) errors.push('Invoice miktarı Packing List toplamı ile uyuşmuyor.')
  }

  if (shipment) {
    const wTol = 0.001
    const weightOk =
      Math.abs(set.commercialInvoice.netWeightKg - shipment.totals.netWeightKg) <= wTol &&
      Math.abs(set.commercialInvoice.grossWeightKg - shipment.totals.grossWeightKg) <= wTol
    const cbmOk = Math.abs(set.commercialInvoice.volumeCbm - shipment.totals.volumeCbm) <= 0.0001
    checks.push({
      code: 'WEIGHT_RECONCILE_SHIPMENT',
      passed: weightOk,
      detail: `invNet=${set.commercialInvoice.netWeightKg} shipNet=${shipment.totals.netWeightKg}`,
    })
    checks.push({
      code: 'CBM_RECONCILE_SHIPMENT',
      passed: cbmOk,
      detail: `invCbm=${set.commercialInvoice.volumeCbm} shipCbm=${shipment.totals.volumeCbm}`,
    })
    if (!weightOk) errors.push('Ağırlık Shipment ile reconcile edilmiyor.')
    if (!cbmOk) errors.push('CBM Shipment ile reconcile edilmiyor.')
  }

  return {
    documentSetId: set.id,
    ok: errors.length === 0,
    errors,
    checks,
  }
}

function persist(
  set: ExportDocumentSet,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): ExportDocumentSet {
  const now = new Date().toISOString()
  const persisted: PersistedExportDocumentSet = {
    ...set,
    updatedAt: now,
    tenantId: DEFAULT_TENANT_ID,
    version: expectedVersion ?? 1,
    schemaVersion: 1,
    deletedAt: null,
  }
  const order = querySalesOrderById(set.salesOrderId)
  const saved = repo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion != null ? expectedVersion : undefined,
  })
  logAudit(
    'ExportDocumentSet',
    saved.id,
    changeType === 'CreateExportDocumentSet' ? 'CREATE' : 'UPDATE',
    {
      ...auditContext(actorUserId),
      description: `${saved.documentSetNo} / ${saved.commercialInvoice.invoiceNo} — ${changeType}`,
    },
    null,
    {
      documentSetNo: saved.documentSetNo,
      invoiceNo: saved.commercialInvoice.invoiceNo,
      status: saved.status,
      totalQty: saved.commercialInvoice.totalQty,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-eds-${saved.id}-${Date.now()}`,
    entityType: 'SALES_ORDER',
    entityId: saved.salesOrderId,
    entityCode: saved.salesOrderNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.documentSetNo} · ${saved.status}`,
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

function requireSet(id: string): PersistedExportDocumentSet {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new CommercialDocumentsDomainError(`Export document set bulunamadı: ${id}`)
  return row
}

const ALLOWED: Record<DocumentLifecycleStatus, DocumentLifecycleStatus[]> = {
  Draft: ['UnderReview'],
  UnderReview: ['Approved', 'Draft'],
  Approved: ['Issued', 'UnderReview'],
  Issued: ['Archived'],
  Archived: [],
}

function buildInvoiceLinesFromPl(
  pl: NonNullable<ReturnType<typeof queryPackingListById>>,
  unitPrice: number,
): CommercialInvoiceLine[] {
  const agg: Record<string, { color: string; size: string; quantity: number }> = {}
  for (const pkg of pl.packages) {
    for (const line of pkg.lines) {
      const key = `${line.color}|${line.size}`
      agg[key] ??= { color: line.color, size: line.size, quantity: 0 }
      agg[key]!.quantity += line.quantity
    }
  }
  return Object.values(agg).map((l, i) => ({
    id: `cil-${i}`,
    color: l.color,
    size: l.size,
    quantity: l.quantity,
    unitPrice,
    lineAmount: Math.round(l.quantity * unitPrice * 100) / 100,
  }))
}

export function persistCreateExportDocumentSet(
  input: CreateExportDocumentSetInput,
  actorUserId: string,
): ExportDocumentSet {
  if (!input.idempotencyKey?.trim()) {
    throw new CommercialDocumentsDomainError('idempotencyKey zorunlu.')
  }
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const shipment = queryShipmentById(input.shipmentId)
  if (!shipment) throw new CommercialDocumentsDomainError(`Shipment bulunamadı: ${input.shipmentId}`)
  if (!SHIPMENT_APPROVED_STATUSES.includes(shipment.status)) {
    throw new CommercialDocumentsDomainError(
      `Commercial Invoice yalnızca Approved Shipment üzerinden (Booked+). Durum: ${shipment.status}`,
    )
  }
  if (!shipment.packingListIds.length) {
    throw new CommercialDocumentsDomainError('Shipment üzerinde Packing List yok.')
  }

  const packingListId = shipment.packingListIds[0]!
  const pl = queryPackingListById(packingListId)
  if (!pl) throw new CommercialDocumentsDomainError(`Packing list bulunamadı: ${packingListId}`)

  const order = querySalesOrderById(shipment.salesOrderId)
  if (!order) throw new CommercialDocumentsDomainError(`Sales order bulunamadı: ${shipment.salesOrderId}`)

  const unitPrice = input.unitPrice ?? 1
  const lines = buildInvoiceLinesFromPl(pl, unitPrice)
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0)
  const totalAmount = Math.round(lines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100

  // Reconcile weights/CBM from shipment (authoritative logistics totals)
  const invoice: CommercialInvoice = {
    id: `ci-${input.idempotencyKey}`,
    invoiceNo: `CI-2026-${String(repo().nextInvoiceCounter()).padStart(4, '0')}`,
    currency: input.currency ?? 'USD',
    incoterm: input.incoterm ?? null,
    paymentTerm: input.paymentTerm ?? null,
    lines,
    totalQty,
    totalAmount,
    netWeightKg: shipment.totals.netWeightKg,
    grossWeightKg: shipment.totals.grossWeightKg,
    volumeCbm: shipment.totals.volumeCbm,
    status: 'Draft',
  }

  if (totalQty !== pl.totals.totalQty) {
    throw new CommercialDocumentsDomainError(
      `Invoice qty ${totalQty} ≠ Packing List ${pl.totals.totalQty}`,
    )
  }

  const now = new Date().toISOString()
  const set: ExportDocumentSet = {
    id: `eds-${input.idempotencyKey}`,
    documentSetNo: `EDS-2026-${String(repo().nextDocumentSetCounter()).padStart(4, '0')}`,
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    shipmentId: shipment.id,
    shipmentNo: shipment.shipmentNo,
    packingListId: pl.id,
    status: 'Draft',
    commercialInvoice: invoice,
    packingListReference: {
      packingListId: pl.id,
      packingListNo: pl.packingListNo,
      totalQty: pl.totals.totalQty,
      packageCount: pl.totals.packageCount,
      netWeightKg: pl.totals.netWeightKg,
      grossWeightKg: pl.totals.grossWeightKg,
      volumeCbm: pl.totals.volumeCbm,
    },
    certificateOfOrigin: {
      id: `coo-${input.idempotencyKey}`,
      certificateNo: null,
      countryOfOrigin: input.countryOfOrigin ?? 'TR',
      status: 'Draft',
      issuedAt: null,
    },
    inspectionCertificate: {
      id: `insp-${input.idempotencyKey}`,
      certificateNo: null,
      inspectionBody: null,
      status: 'Draft',
      issuedAt: null,
    },
    billOfLadingReference: {
      id: `bl-${input.idempotencyKey}`,
      blNo: null,
      carrier: shipment.forwarderCode,
      status: 'Draft',
      issuedAt: null,
    },
    exportDeclaration: {
      id: `exd-${input.idempotencyKey}`,
      declarationNo: null,
      customsOffice: null,
      status: 'Draft',
      issuedAt: null,
    },
    attachments: [],
    revisions: [
      {
        id: `rev-${input.idempotencyKey}-1`,
        revision: 1,
        status: 'Draft',
        snapshotJson: '',
        createdAt: now,
        createdBy: actorUserId,
        reason: 'Initial',
      },
    ],
    approvals: [],
    validationErrors: [],
    idempotencyKey: input.idempotencyKey,
    issuedAt: null,
    archivedAt: null,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  set.revisions[0]!.snapshotJson = snapshot(set)
  const validation = validateExportDocumentSet(set)
  set.validationErrors = validation.errors
  return persist(set, actorUserId, 'CreateExportDocumentSet')
}

export function persistTransitionDocumentSet(
  input: TransitionDocumentSetInput,
  actorUserId: string,
): ExportDocumentSet {
  if (!input.idempotencyKey?.trim()) {
    throw new CommercialDocumentsDomainError('idempotencyKey zorunlu.')
  }
  const row = requireSet(input.documentSetId)
  const current = toDomain(row)
  if (current.status === input.toStatus) return current

  const allowed = ALLOWED[current.status] ?? []
  if (!allowed.includes(input.toStatus)) {
    throw new CommercialDocumentsDomainError(
      `${current.status} → ${input.toStatus} geçişi yasak.`,
    )
  }

  if (input.toStatus === 'UnderReview' || input.toStatus === 'Approved') {
    const validation = validateExportDocumentSet(current)
    if (!validation.ok) {
      throw new CommercialDocumentsDomainError(`Doğrulama başarısız: ${validation.errors[0]}`)
    }
  }

  if (input.toStatus === 'Issued') {
    if (current.status !== 'Approved') {
      throw new CommercialDocumentsDomainError('Yalnızca Approved doküman Issued olabilir.')
    }
    const validation = validateExportDocumentSet(current)
    if (!validation.ok) {
      throw new CommercialDocumentsDomainError(`Issue engellendi: ${validation.errors[0]}`)
    }
  }

  if (current.status === 'Issued' && input.toStatus !== 'Archived') {
    throw new CommercialDocumentsDomainError('Issued doküman salt-okunur (yalnız Archive).')
  }

  const now = new Date().toISOString()
  const action =
    input.toStatus === 'UnderReview'
      ? 'Submit'
      : input.toStatus === 'Approved'
        ? 'Approve'
        : input.toStatus === 'Issued'
          ? 'Issue'
          : input.toStatus === 'Archived'
            ? 'Archive'
            : 'Submit'

  const next: ExportDocumentSet = {
    ...current,
    status: input.toStatus,
    commercialInvoice: { ...current.commercialInvoice, status: input.toStatus },
    certificateOfOrigin: {
      ...current.certificateOfOrigin,
      status: input.toStatus === 'Issued' ? 'Issued' : current.certificateOfOrigin.status,
      issuedAt:
        input.toStatus === 'Issued'
          ? now
          : current.certificateOfOrigin.issuedAt,
      certificateNo:
        input.toStatus === 'Issued'
          ? current.certificateOfOrigin.certificateNo ?? `COO-${current.documentSetNo}`
          : current.certificateOfOrigin.certificateNo,
    },
    inspectionCertificate: {
      ...current.inspectionCertificate,
      status: input.toStatus === 'Issued' ? 'Issued' : current.inspectionCertificate.status,
      issuedAt: input.toStatus === 'Issued' ? now : current.inspectionCertificate.issuedAt,
      certificateNo:
        input.toStatus === 'Issued'
          ? current.inspectionCertificate.certificateNo ?? `IC-${current.documentSetNo}`
          : current.inspectionCertificate.certificateNo,
    },
    billOfLadingReference: {
      ...current.billOfLadingReference,
      status: input.toStatus === 'Issued' ? 'Issued' : current.billOfLadingReference.status,
      issuedAt: input.toStatus === 'Issued' ? now : current.billOfLadingReference.issuedAt,
      blNo:
        input.toStatus === 'Issued'
          ? current.billOfLadingReference.blNo ?? `BL-${current.shipmentNo}`
          : current.billOfLadingReference.blNo,
    },
    exportDeclaration: {
      ...current.exportDeclaration,
      status: input.toStatus === 'Issued' ? 'Issued' : current.exportDeclaration.status,
      issuedAt: input.toStatus === 'Issued' ? now : current.exportDeclaration.issuedAt,
      declarationNo:
        input.toStatus === 'Issued'
          ? current.exportDeclaration.declarationNo ?? `EXD-${current.documentSetNo}`
          : current.exportDeclaration.declarationNo,
    },
    approvals: [
      ...current.approvals,
      {
        id: `appr-${input.idempotencyKey}`,
        action,
        actorUserId,
        occurredAt: now,
        note: input.note ?? null,
      },
    ],
    issuedAt: input.toStatus === 'Issued' ? now : current.issuedAt,
    archivedAt: input.toStatus === 'Archived' ? now : current.archivedAt,
    validationErrors: [],
    idempotencyKey: `tr-${input.idempotencyKey}`,
  }
  return persist(next, actorUserId, 'TransitionExportDocumentSet', row.version)
}

export function persistAttachDocument(
  input: AttachDocumentInput,
  actorUserId: string,
): ExportDocumentSet {
  if (!input.idempotencyKey?.trim()) {
    throw new CommercialDocumentsDomainError('idempotencyKey zorunlu.')
  }
  const row = requireSet(input.documentSetId)
  const current = toDomain(row)
  assertWritable(current)
  if (current.attachments.some((a) => a.id === `att-${input.idempotencyKey}`)) return current

  return persist(
    {
      ...current,
      attachments: [
        ...current.attachments,
        {
          id: `att-${input.idempotencyKey}`,
          fileName: input.fileName,
          mimeType: input.mimeType,
          documentKind: input.documentKind,
          uploadedAt: new Date().toISOString(),
          uploadedBy: actorUserId,
        },
      ],
      idempotencyKey: `att-${input.idempotencyKey}`,
    },
    actorUserId,
    'AttachExportDocument',
    row.version,
  )
}

/** Create immutable revision snapshot and return set to Draft for edits. */
export function persistReviseDocumentSet(
  input: ReviseDocumentSetInput,
  actorUserId: string,
): ExportDocumentSet {
  if (!input.idempotencyKey?.trim()) {
    throw new CommercialDocumentsDomainError('idempotencyKey zorunlu.')
  }
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const row = requireSet(input.documentSetId)
  const current = toDomain(row)
  if (current.status === 'Issued' || current.status === 'Archived') {
    throw new CommercialDocumentsDomainError('Issued/Archived doküman revize edilemez.')
  }

  const now = new Date().toISOString()
  const revisionNo = current.revisions.length + 1
  const next: ExportDocumentSet = {
    ...current,
    status: 'Draft',
    commercialInvoice: { ...current.commercialInvoice, status: 'Draft' },
    revisions: [
      ...current.revisions,
      {
        id: `rev-${input.idempotencyKey}`,
        revision: revisionNo,
        status: current.status,
        snapshotJson: snapshot(current),
        createdAt: now,
        createdBy: actorUserId,
        reason: input.reason ?? `Revision ${revisionNo}`,
      },
    ],
    idempotencyKey: input.idempotencyKey,
  }
  return persist(next, actorUserId, 'ReviseExportDocumentSet', row.version)
}

export function persistValidateDocumentSet(
  documentSetId: string,
  actorUserId: string,
): ExportDocumentSet {
  const row = requireSet(documentSetId)
  const current = toDomain(row)
  const validation = validateExportDocumentSet(current)
  return persist(
    { ...current, validationErrors: validation.errors },
    actorUserId,
    'ValidateExportDocumentSet',
    row.version,
  )
}
