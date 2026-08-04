import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedMrpRun } from '@/domain/ports/persistence/persistence-aggregates'
import type { IMrpRunRepository } from '@/domain/ports/persistence/aggregates/mrp-run.repository'
import type { MrpRun } from '@/domain/mrp/mrp.types'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

function mrpRunRepo(): IMrpRunRepository {
  return requireUnitOfWork().mrpRuns
}

function strip(row: PersistedMrpRun): MrpRun {
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

export function queryAllMrpRuns(): MrpRun[] {
  const page = mrpRunRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(strip).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function queryMrpRunById(id: string): MrpRun | null {
  const row = mrpRunRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryLatestMrpRun(): MrpRun | null {
  const all = queryAllMrpRuns()
  return all[0] ?? null
}

export function queryMrpRunVersion(id: string): number {
  return mrpRunRepo().version(DEFAULT_TENANT_ID, id)
}
