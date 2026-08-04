import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedRequestForQuotation, PersistedSupplierQuotation } from '@/domain/ports/persistence/persistence-aggregates'
import type { IRequestForQuotationRepository } from '@/domain/ports/persistence/aggregates/rfq.repository'
import type { ISupplierQuotationRepository } from '@/domain/ports/persistence/aggregates/supplier-quotation.repository'
import type { RequestForQuotation, SupplierQuotation } from '@/domain/purchasing/purchasing.types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function rfqRepo(): IRequestForQuotationRepository {
  return requireUnitOfWork().rfqs
}

function quotationRepo(): ISupplierQuotationRepository {
  return requireUnitOfWork().supplierQuotations
}

function stripRfq(row: PersistedRequestForQuotation): RequestForQuotation {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...rfq
  } = row
  return rfq as RequestForQuotation
}

function stripQuotation(row: PersistedSupplierQuotation): SupplierQuotation {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    updatedAt: _u,
    ...q
  } = row
  return q as SupplierQuotation
}

export function queryAllRfqs(): RequestForQuotation[] {
  return rfqRepo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
    .items.map(stripRfq)
}

export function queryRfqById(id: string): RequestForQuotation | null {
  const row = rfqRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? stripRfq(row) : null
}

export function queryQuotationsByRfqId(rfqId: string): SupplierQuotation[] {
  return quotationRepo()
    .findByRfqId(DEFAULT_TENANT_ID, rfqId)
    .map(stripQuotation)
}

export function queryAllQuotations(): SupplierQuotation[] {
  return quotationRepo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
    .items.map(stripQuotation)
}

export function queryQuotationById(id: string): SupplierQuotation | null {
  const row = quotationRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? stripQuotation(row) : null
}
