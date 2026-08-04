/**
 * RFQ + Supplier Quotation CRUD.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { supplierRepository } from '@/domain/master-data'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type {
  PersistedRequestForQuotation,
  PersistedSupplierQuotation,
} from '@/domain/ports/persistence/persistence-aggregates'
import type { IRequestForQuotationRepository } from '@/domain/ports/persistence/aggregates/rfq.repository'
import type { ISupplierQuotationRepository } from '@/domain/ports/persistence/aggregates/supplier-quotation.repository'
import { schedulePurchasingChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import type { RequestForQuotation, SupplierQuotation } from '@/domain/purchasing/purchasing.types'

import { queryPurchaseRequestById } from './purchase-request-query.service'
import { queryAllRfqs, queryRfqById } from './rfq-query.service'

export class RfqDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RfqDomainError'
  }
}

export type CreateRfqInput = {
  purchaseRequestIds: string[]
  supplierCodes: string[]
  dueDate: string
  notes?: string
}

function rfqRepo(): IRequestForQuotationRepository {
  return requireUnitOfWork().rfqs
}

function quotationRepo(): ISupplierQuotationRepository {
  return requireUnitOfWork().supplierQuotations
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function nextRfqId(): string {
  return String(queryAllRfqs().reduce((m, r) => Math.max(m, Number.parseInt(r.id, 10) || 0), 0) + 1)
}

function nextRfqNo(): string {
  const max = queryAllRfqs().reduce((m, r) => {
    const match = r.rfqNo.match(/RFQ-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `RFQ-2026-${String(max + 1).padStart(4, '0')}`
}

function nextQuotationNo(): string {
  const all = quotationRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: 500 }).items
  const max = all.reduce((m, q) => {
    const match = q.quotationNo.match(/TEK-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `TEK-2026-${String(max + 1).padStart(4, '0')}`
}

export function persistCreateRfq(input: CreateRfqInput, actorUserId: string): RequestForQuotation {
  if (input.purchaseRequestIds.length === 0) {
    throw new RfqDomainError('En az bir satın alma talebi seçilmelidir.')
  }
  if (input.supplierCodes.length === 0) {
    throw new RfqDomainError('En az bir tedarikçi seçilmelidir.')
  }

  for (const prId of input.purchaseRequestIds) {
    const pr = queryPurchaseRequestById(prId)
    if (!pr) throw new RfqDomainError(`SAT bulunamadı: ${prId}`)
    if (pr.status !== 'Submitted' && pr.status !== 'RFQ Issued') {
      throw new RfqDomainError(`${pr.prNo} RFQ için uygun değil.`)
    }
  }

  const now = new Date().toISOString()
  const rfq: RequestForQuotation = {
    id: nextRfqId(),
    rfqNo: nextRfqNo(),
    purchaseRequestIds: input.purchaseRequestIds,
    supplierCodes: input.supplierCodes,
    dueDate: input.dueDate,
    status: 'Sent',
    notes: input.notes ?? '',
    createdAt: now,
    createdBy: actorUserId,
  }

  const persisted: PersistedRequestForQuotation = {
    ...rfq,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  rfqRepo().save(DEFAULT_TENANT_ID, persisted)

  for (const supplierCode of input.supplierCodes) {
    const supplier = supplierRepository.getByCode(supplierCode)
    const lines = input.purchaseRequestIds.map((prId) => {
      const pr = queryPurchaseRequestById(prId)!
      return {
        id: `ql-${prId}-${supplierCode}`,
        materialCode: pr.materialCode,
        materialName: pr.materialName,
        quantity: pr.quantity,
        unit: pr.unit,
        unitPrice: 0,
        leadTimeDays: supplier?.leadTimeDays ?? 14,
      }
    })
    const quotation: SupplierQuotation = {
      id: `q-${rfq.id}-${supplierCode}`,
      quotationNo: nextQuotationNo(),
      rfqId: rfq.id,
      rfqNo: rfq.rfqNo,
      supplierCode,
      supplierName: supplier?.name ?? supplierCode,
      quotedDate: now.slice(0, 10),
      currency: 'USD',
      lines,
      totalAmount: 0,
      status: 'Pending',
      createdAt: now,
    }
    const qPersisted: PersistedSupplierQuotation = {
      ...quotation,
      tenantId: DEFAULT_TENANT_ID,
      version: 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    quotationRepo().save(DEFAULT_TENANT_ID, qPersisted)
  }

  logAudit(
    'RFQ',
    rfq.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `RFQ oluşturuldu: ${rfq.rfqNo}` },
    null,
    { rfqNo: rfq.rfqNo, supplierCount: input.supplierCodes.length },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-rfq-${rfq.id}-${Date.now()}`,
    entityType: 'PURCHASE_REQUEST',
    entityId: rfq.id,
    entityCode: rfq.rfqNo,
    occurredAt: now,
    actor: actorUserId,
    action: 'RFQ_CREATE',
    reason: `${input.supplierCodes.length} tedarikçiye gönderildi`,
  })
  schedulePurchasingChange({
    entityType: 'RFQ',
    entityId: rfq.id,
    entityNo: rfq.rfqNo,
    status: rfq.status,
    changeType: 'CreateRFQ',
    occurredAt: now,
    actorUserId,
  })

  return rfq
}

export function persistSubmitQuotationPrices(
  quotationId: string,
  lines: { materialCode: string; unitPrice: number }[],
  _actorUserId: string,
): SupplierQuotation {
  const row = quotationRepo().findById(DEFAULT_TENANT_ID, quotationId)
  if (!row) throw new RfqDomainError('Teklif bulunamadı.')

  const updatedLines = row.lines.map((line) => {
    const price = lines.find((l) => l.materialCode === line.materialCode)
    return price ? { ...line, unitPrice: price.unitPrice } : line
  })
  const totalAmount = updatedLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const updated: SupplierQuotation = {
    ...row,
    lines: updatedLines,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'Pending',
    quotedDate: new Date().toISOString().slice(0, 10),
  }

  const saved = quotationRepo().save(DEFAULT_TENANT_ID, {
    ...updated,
    tenantId: DEFAULT_TENANT_ID,
    version: row.version,
    schemaVersion: 1,
    createdAt: row.createdAt,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  })

  const rfq = queryRfqById(updated.rfqId)
  if (rfq && rfq.status === 'Sent') {
    rfqRepo().save(DEFAULT_TENANT_ID, {
      ...rfq,
      status: 'Quoted',
      tenantId: DEFAULT_TENANT_ID,
      version: rfqRepo().version(DEFAULT_TENANT_ID, rfq.id),
      schemaVersion: 1,
      createdAt: rfq.createdAt,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })
  }

  return saved as unknown as SupplierQuotation
}

export function persistSelectQuotation(quotationId: string, actorUserId: string): SupplierQuotation {
  const row = quotationRepo().findById(DEFAULT_TENANT_ID, quotationId)
  if (!row) throw new RfqDomainError('Teklif bulunamadı.')

  for (const other of quotationRepo().findByRfqId(DEFAULT_TENANT_ID, row.rfqId)) {
    if (other.id === quotationId) continue
    quotationRepo().save(DEFAULT_TENANT_ID, {
      ...other,
      status: 'Rejected',
      tenantId: DEFAULT_TENANT_ID,
      version: other.version,
      schemaVersion: 1,
      createdAt: other.createdAt,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })
  }

  const saved = quotationRepo().save(DEFAULT_TENANT_ID, {
    ...row,
    status: 'Selected',
    tenantId: DEFAULT_TENANT_ID,
    version: row.version,
    schemaVersion: 1,
    createdAt: row.createdAt,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  })

  const rfq = queryRfqById(row.rfqId)
  if (rfq) {
    rfqRepo().save(DEFAULT_TENANT_ID, {
      ...rfq,
      status: 'Awarded',
      tenantId: DEFAULT_TENANT_ID,
      version: rfqRepo().version(DEFAULT_TENANT_ID, rfq.id),
      schemaVersion: 1,
      createdAt: rfq.createdAt,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    })
  }

  logAudit(
    'SupplierQuotation',
    quotationId,
    'APPROVE',
    { ...auditContext(actorUserId), description: `Teklif seçildi: ${row.quotationNo}` },
    { status: row.status },
    { status: 'Selected' },
  )

  return saved as unknown as SupplierQuotation
}
