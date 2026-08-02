import type {
  RevisionMetadata,
  RevisionStatus,
  VersionedEntityType,
  VersionedRecord,
} from '../types'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../../ports/persistence/persistence-registry'
import type { PersistedEntityRevision } from '../../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../../ports/persistence/persistence.types'

export type CreateRevisionInput<T> = {
  entityType: VersionedEntityType
  entityKey: string
  payload: T
  version: string
  reasonOfChange: string
  createdBy: string
  status?: RevisionStatus
}

export type ActivateRevisionInput = {
  recordId: string
  approvedBy: string
  effectiveFrom?: string
}

function revisionRepo() {
  return requireUnitOfWork().entityRevisions
}

function stripRevisionMeta(row: PersistedEntityRevision): VersionedRecord {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    createdAt: _c,
    updatedAt: _u,
    deletedAt: _d,
    ...rest
  } = row
  return rest as VersionedRecord
}

function nextRevisionNo(entityType: VersionedEntityType, entityKey: string): number {
  const existing = revisionRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityKey)
  return existing.length > 0 ? Math.max(...existing.map((r) => r.revision.revisionNo)) + 1 : 1
}

export function createRevision<T extends Record<string, unknown>>(
  input: CreateRevisionInput<T>,
): VersionedRecord<T> {
  const revisionNo = nextRevisionNo(input.entityType, input.entityKey)
  const now = new Date().toISOString()
  const record: VersionedRecord<T> = {
    id: `rev-${input.entityType}-${input.entityKey}-${revisionNo}`,
    entityType: input.entityType,
    entityKey: input.entityKey,
    revision: {
      revisionNo,
      version: input.version,
      status: input.status ?? 'Draft',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      createdBy: input.createdBy,
      createdAt: now,
      reasonOfChange: input.reasonOfChange,
    },
    payload: input.payload,
  }
  const persisted: PersistedEntityRevision = {
    ...(record as VersionedRecord),
    tenantId: DEFAULT_TENANT_ID,
    version: revisionNo,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  revisionRepo().save(DEFAULT_TENANT_ID, persisted)
  return record
}

export function activateRevision(input: ActivateRevisionInput): VersionedRecord | null {
  const row = revisionRepo().findById(DEFAULT_TENANT_ID, input.recordId)
  if (!row) return null
  const record = stripRevisionMeta(row)

  const allForEntity = revisionRepo().findByEntity(DEFAULT_TENANT_ID, record.entityType, record.entityKey)
  for (const r of allForEntity) {
    if (r.revision.status === 'Active') {
      revisionRepo().save(DEFAULT_TENANT_ID, {
        ...r,
        revision: {
          ...r.revision,
          status: 'Obsolete',
          effectiveTo: input.effectiveFrom ?? new Date().toISOString().slice(0, 10),
        },
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const updated: PersistedEntityRevision = {
    ...row,
    revision: {
      ...row.revision,
      status: 'Active',
      approvedBy: input.approvedBy,
      approvedDate: new Date().toISOString(),
      effectiveFrom: input.effectiveFrom ?? new Date().toISOString().slice(0, 10),
    },
    updatedAt: new Date().toISOString(),
  }
  revisionRepo().save(DEFAULT_TENANT_ID, updated)
  return stripRevisionMeta(updated)
}

export function obsoleteRevision(recordId: string, reason: string): VersionedRecord | null {
  const row = revisionRepo().findById(DEFAULT_TENANT_ID, recordId)
  if (!row) return null
  const updated: PersistedEntityRevision = {
    ...row,
    revision: {
      ...row.revision,
      status: 'Obsolete',
      effectiveTo: new Date().toISOString().slice(0, 10),
      reasonOfChange: reason,
    },
    updatedAt: new Date().toISOString(),
  }
  revisionRepo().save(DEFAULT_TENANT_ID, updated)
  return stripRevisionMeta(updated)
}

export function getRevisions(
  entityType: VersionedEntityType,
  entityKey: string,
): VersionedRecord[] {
  return revisionRepo()
    .findByEntity(DEFAULT_TENANT_ID, entityType, entityKey)
    .map(stripRevisionMeta)
    .sort((a, b) => b.revision.revisionNo - a.revision.revisionNo)
}

export function getActiveRevision(
  entityType: VersionedEntityType,
  entityKey: string,
): VersionedRecord | undefined {
  const row = revisionRepo().findActive(DEFAULT_TENANT_ID, entityType, entityKey)
  return row ? stripRevisionMeta(row) : undefined
}

export function getRevisionById(id: string): VersionedRecord | undefined {
  const row = revisionRepo().findById(DEFAULT_TENANT_ID, id)
  return row ? stripRevisionMeta(row) : undefined
}

export function seedRevisions(records: VersionedRecord[]): void {
  revisionRepo().seedFromLegacy(records)
}

export function getAllRevisions(): VersionedRecord[] {
  const page = revisionRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripRevisionMeta)
}

export function canUseRevisionInProduction(record: VersionedRecord): boolean {
  return record.revision.status === 'Active' || record.revision.status === 'Obsolete'
}

export function getRevisionSummary(meta: RevisionMetadata): string {
  return `Rev.${meta.revisionNo} v${meta.version} [${meta.status}] — ${meta.reasonOfChange ?? '—'}`
}
