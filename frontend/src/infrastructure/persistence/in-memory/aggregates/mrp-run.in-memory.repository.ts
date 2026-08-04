import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedMrpRun } from '@/domain/ports/persistence/persistence-aggregates'
import type { IMrpRunRepository } from '@/domain/ports/persistence/aggregates/mrp-run.repository'
import type { MrpRun } from '@/domain/mrp/mrp.types'

import { conflictError, paginate } from '../in-memory-helpers'
import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

function stripRun(row: PersistedMrpRun): MrpRun {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    createdAt: _c,
    updatedAt: _u,
    ...run
  } = row
  return run as MrpRun
}

export class MrpRunInMemoryRepository implements IMrpRunRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  findById(tenantId: string, id: string): PersistedMrpRun | null {
    return (
      this.stores.mrpRuns.find((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt) ?? null
    )
  }

  findByIdForUpdate(tenantId: string, id: string): PersistedMrpRun | null {
    return this.findById(tenantId, id)
  }

  findByCode(tenantId: string, code: string): PersistedMrpRun | null {
    return this.findByRunNo(tenantId, code)
  }

  findByRunNo(tenantId: string, runNo: string): PersistedMrpRun | null {
    return (
      this.stores.mrpRuns.find(
        (r) => r.tenantId === tenantId && r.runNo === runNo && !r.deletedAt,
      ) ?? null
    )
  }

  save(
    tenantId: string,
    aggregate: PersistedMrpRun,
    options?: { expectedVersion?: number },
  ): PersistedMrpRun {
    const idx = this.stores.mrpRuns.findIndex((r) => r.tenantId === tenantId && r.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.stores.mrpRuns[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('MrpRun', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const now = new Date().toISOString()
    const next: PersistedMrpRun = {
      ...aggregate,
      tenantId,
      version: idx >= 0 ? this.stores.mrpRuns[idx]!.version + 1 : 1,
      updatedAt: now,
      createdAt: idx >= 0 ? this.stores.mrpRuns[idx]!.createdAt : now,
    }
    if (idx >= 0) this.stores.mrpRuns[idx] = next
    else this.stores.mrpRuns.push(next)
    return next
  }

  delete(tenantId: string, id: string): void {
    const idx = this.stores.mrpRuns.findIndex((r) => r.tenantId === tenantId && r.id === id)
    if (idx >= 0) {
      this.stores.mrpRuns[idx] = {
        ...this.stores.mrpRuns[idx]!,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  exists(tenantId: string, id: string): boolean {
    return this.stores.mrpRuns.some((r) => r.tenantId === tenantId && r.id === id && !r.deletedAt)
  }

  version(tenantId: string, id: string): number {
    return this.findById(tenantId, id)?.version ?? 0
  }

  cursor(
    tenantId: string,
    filter: Record<string, unknown>,
    page: CursorPage,
  ): PageResult<PersistedMrpRun> {
    let rows = this.stores.mrpRuns.filter((r) => r.tenantId === tenantId && !r.deletedAt)
    if (typeof filter.status === 'string') {
      rows = rows.filter((r) => r.status === filter.status)
    }
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return paginate(rows, page)
  }

  cursorLatest(tenantId: string, page: CursorPage): PageResult<PersistedMrpRun> {
    const rows = this.stores.mrpRuns
      .filter((r) => r.tenantId === tenantId && !r.deletedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return paginate(rows, page)
  }

  listAll(tenantId: string): MrpRun[] {
    return this.stores.mrpRuns
      .filter((r) => r.tenantId === tenantId && !r.deletedAt)
      .map(stripRun)
  }
}
