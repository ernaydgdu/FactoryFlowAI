/**
 * Purchase Request CRUD — MRP proposal → PR write path.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedPurchaseRequest } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseRequestRepository } from '@/domain/ports/persistence/aggregates/purchase-request.repository'
import { schedulePurchasingChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type { PurchaseRequest } from '@/domain/purchasing/purchasing.types'

import { queryAllPurchaseRequests } from './purchase-request-query.service'

export class PurchaseRequestDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseRequestDomainError'
  }
}

export type CreatePurchaseRequestInput = {
  mrpRunId?: string
  mrpProposalId?: string
  sourceOrderId: string
  sourceOrderNo: string
  stockCardId: string
  quantity: number
  requiredDate: string
  suggestedSupplier: string
}

function prRepo(): IPurchaseRequestRepository {
  return requireUnitOfWork().purchaseRequests
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function strip(row: PersistedPurchaseRequest): PurchaseRequest {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...pr
  } = row
  return pr as PurchaseRequest
}

function save(pr: PurchaseRequest, expectedVersion?: number): PurchaseRequest {
  const existing = prRepo().findById(DEFAULT_TENANT_ID, pr.id)
  const persisted: PersistedPurchaseRequest = {
    ...pr,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? pr.createdAt,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
  return strip(prRepo().save(DEFAULT_TENANT_ID, persisted, { expectedVersion: expectedVersion ?? existing?.version }))
}

function nextPrId(): string {
  const all = queryAllPurchaseRequests()
  return String(all.reduce((m, r) => Math.max(m, Number.parseInt(r.id, 10) || 0), 0) + 1)
}

function nextPrNo(): string {
  const all = queryAllPurchaseRequests()
  const max = all.reduce((m, r) => {
    const match = r.prNo.match(/SAT-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `SAT-2026-${String(max + 1).padStart(4, '0')}`
}

function emit(pr: PurchaseRequest, changeType: string, actorUserId: string): void {
  schedulePurchasingChange({
    entityType: 'PurchaseRequest',
    entityId: pr.id,
    entityNo: pr.prNo,
    status: pr.status,
    changeType,
    occurredAt: new Date().toISOString(),
    actorUserId,
  })
}

export function persistCreatePurchaseRequest(
  input: CreatePurchaseRequestInput,
  actorUserId: string,
): PurchaseRequest {
  const card = queryStockCardById(input.stockCardId)
  if (!card) throw new PurchaseRequestDomainError('Stok kartı bulunamadı.')

  const now = new Date().toISOString()
  const pr: PurchaseRequest = {
    id: nextPrId(),
    prNo: nextPrNo(),
    mrpRunId: input.mrpRunId,
    mrpProposalId: input.mrpProposalId,
    sourceOrderId: input.sourceOrderId,
    sourceOrderNo: input.sourceOrderNo,
    stockCardId: input.stockCardId,
    materialCode: card.code,
    materialName: card.name,
    category: card.category,
    quantity: input.quantity,
    unit: card.unit,
    requiredDate: input.requiredDate,
    suggestedSupplier: input.suggestedSupplier || card.supplier,
    status: 'Submitted',
    createdAt: now,
    createdBy: actorUserId,
  }

  const saved = save(pr)
  logAudit(
    'PurchaseRequest',
    saved.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `SAT oluşturuldu: ${saved.prNo}` },
    null,
    { prNo: saved.prNo, quantity: saved.quantity },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-pr-${saved.id}-${Date.now()}`,
    entityType: 'PURCHASE_REQUEST',
    entityId: saved.id,
    entityCode: saved.prNo,
    occurredAt: now,
    actor: actorUserId,
    action: 'PR_CREATE',
    reason: `MRP kaynaklı talep — ${saved.materialCode}`,
  })
  emit(saved, 'Create', actorUserId)
  return saved
}

export function persistCreatePurchaseRequestFromMrpProposal(
  mrpRunId: string,
  proposal: {
    id: string
    stockCardId: string
    quantity: number
    supplier: string
    requiredDate: string
  },
  sourceOrderId: string,
  sourceOrderNo: string,
  actorUserId: string,
): PurchaseRequest {
  return persistCreatePurchaseRequest(
    {
      mrpRunId,
      mrpProposalId: proposal.id,
      sourceOrderId,
      sourceOrderNo,
      stockCardId: proposal.stockCardId,
      quantity: proposal.quantity,
      requiredDate: proposal.requiredDate,
      suggestedSupplier: proposal.supplier,
    },
    actorUserId,
  )
}
