import type {
  RevisionMetadata,
  RevisionStatus,
  VersionedEntityType,
  VersionedRecord,
} from '../types'

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

const revisionStore: VersionedRecord[] = []

function nextRevisionNo(entityType: VersionedEntityType, entityKey: string): number {
  const existing = revisionStore.filter(
    (r) => r.entityType === entityType && r.entityKey === entityKey,
  )
  return existing.length > 0 ? Math.max(...existing.map((r) => r.revision.revisionNo)) + 1 : 1
}

export function createRevision<T extends Record<string, unknown>>(
  input: CreateRevisionInput<T>,
): VersionedRecord<T> {
  const revisionNo = nextRevisionNo(input.entityType, input.entityKey)
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
      createdAt: new Date().toISOString(),
      reasonOfChange: input.reasonOfChange,
    },
    payload: input.payload,
  }
  revisionStore.push(record as VersionedRecord)
  return record
}

export function activateRevision(input: ActivateRevisionInput): VersionedRecord | null {
  const record = revisionStore.find((r) => r.id === input.recordId)
  if (!record) return null

  for (const r of revisionStore) {
    if (r.entityType === record.entityType && r.entityKey === record.entityKey && r.revision.status === 'Active') {
      r.revision.status = 'Obsolete'
      r.revision.effectiveTo = input.effectiveFrom ?? new Date().toISOString().slice(0, 10)
    }
  }

  record.revision.status = 'Active'
  record.revision.approvedBy = input.approvedBy
  record.revision.approvedDate = new Date().toISOString()
  record.revision.effectiveFrom = input.effectiveFrom ?? new Date().toISOString().slice(0, 10)
  return record
}

export function obsoleteRevision(recordId: string, reason: string): VersionedRecord | null {
  const record = revisionStore.find((r) => r.id === recordId)
  if (!record) return null
  record.revision.status = 'Obsolete'
  record.revision.effectiveTo = new Date().toISOString().slice(0, 10)
  record.revision.reasonOfChange = reason
  return record
}

export function getRevisions(
  entityType: VersionedEntityType,
  entityKey: string,
): VersionedRecord[] {
  return revisionStore
    .filter((r) => r.entityType === entityType && r.entityKey === entityKey)
    .sort((a, b) => b.revision.revisionNo - a.revision.revisionNo)
}

export function getActiveRevision(
  entityType: VersionedEntityType,
  entityKey: string,
): VersionedRecord | undefined {
  return revisionStore.find(
    (r) =>
      r.entityType === entityType &&
      r.entityKey === entityKey &&
      r.revision.status === 'Active',
  )
}

export function getRevisionById(id: string): VersionedRecord | undefined {
  return revisionStore.find((r) => r.id === id)
}

export function seedRevisions(records: VersionedRecord[]): void {
  revisionStore.length = 0
  revisionStore.push(...records)
}

export function getAllRevisions(): VersionedRecord[] {
  return [...revisionStore]
}

export function canUseRevisionInProduction(record: VersionedRecord): boolean {
  return record.revision.status === 'Active' || record.revision.status === 'Obsolete'
}

export function getRevisionSummary(meta: RevisionMetadata): string {
  return `Rev.${meta.revisionNo} v${meta.version} [${meta.status}] — ${meta.reasonOfChange ?? '—'}`
}
