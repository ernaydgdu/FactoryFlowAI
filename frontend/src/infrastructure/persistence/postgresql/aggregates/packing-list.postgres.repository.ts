/**
 * PostgreSQL PackingList aggregate adapter.
 * Implements IPackingListRepository; methods throw until PG cutover (same Sprint-7 pattern as outbox).
 * No mock data — memory backend remains the production path until PERSISTENCE_BACKEND=postgres.
 */
import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedPackingList } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPackingListRepository } from '@/domain/ports/persistence/aggregates/packing-list.repository'

import { PostgresAdapterNotReadyError } from '../postgres-not-implemented.error'

function notReady(op: string): never {
  throw new PostgresAdapterNotReadyError(`packing-list.postgres.repository.${op}`)
}

export class PackingListPostgresRepository implements IPackingListRepository {
  findById(_tenantId: string, _id: string): PersistedPackingList | null {
    notReady('findById')
  }

  findByIdForUpdate(_tenantId: string, _id: string): PersistedPackingList | null {
    notReady('findByIdForUpdate')
  }

  findByCode(_tenantId: string, _code: string): PersistedPackingList | null {
    notReady('findByCode')
  }

  findByPackingListNo(_tenantId: string, _packingListNo: string): PersistedPackingList | null {
    notReady('findByPackingListNo')
  }

  findBySalesOrderId(_tenantId: string, _salesOrderId: string): PersistedPackingList[] {
    notReady('findBySalesOrderId')
  }

  findByIdempotencyKey(_tenantId: string, _idempotencyKey: string): PersistedPackingList | null {
    notReady('findByIdempotencyKey')
  }

  nextPackingListCounter(): number {
    notReady('nextPackingListCounter')
  }

  nextSsccSerial(): number {
    notReady('nextSsccSerial')
  }

  save(
    _tenantId: string,
    _aggregate: PersistedPackingList,
    _options?: { expectedVersion?: number },
  ): PersistedPackingList {
    notReady('save')
  }

  delete(_tenantId: string, _id: string): void {
    notReady('delete')
  }

  exists(_tenantId: string, _id: string): boolean {
    notReady('exists')
  }

  version(_tenantId: string, _id: string): number {
    notReady('version')
  }

  cursor(
    _tenantId: string,
    _filter: Record<string, unknown>,
    _page: CursorPage,
  ): PageResult<PersistedPackingList> {
    notReady('cursor')
  }
}

export const packingListPostgresRepository = new PackingListPostgresRepository()
