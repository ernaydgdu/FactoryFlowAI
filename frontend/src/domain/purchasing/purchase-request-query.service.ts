import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedPurchaseRequest } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPurchaseRequestRepository } from '@/domain/ports/persistence/aggregates/purchase-request.repository'
import type { PurchaseRequest } from '@/domain/purchasing/purchasing.types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function repo(): IPurchaseRequestRepository {
  return requireUnitOfWork().purchaseRequests
}

function strip(row: PersistedPurchaseRequest): PurchaseRequest {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...pr
  } = row
  return pr as PurchaseRequest
}

export function queryAllPurchaseRequests(): PurchaseRequest[] {
  return repo()
    .cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
    .items.map(strip)
}

export function queryPurchaseRequestById(id: string): PurchaseRequest | null {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryPurchaseRequestVersion(id: string): number {
  return repo().version(DEFAULT_TENANT_ID, id)
}
