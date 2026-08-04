/**
 * Append-only memory store over existing brainDecisionMemory stream (Freeze-safe).
 * Never deletes. Never mutates ERP aggregates.
 */
import type { DecisionMemoryEntry } from '@/domain/brain/twin/types'
import {
  brainDecisionMemoryRepo,
  DEFAULT_TENANT_ID,
} from '@/domain/platform/platform-persistence-access'

import type { MemoryRecord } from './types'
import {
  MFG_MEMORY_COMPANY_ID,
  MFG_MEMORY_DECISION_PREFIX,
  MANUFACTURING_MEMORY_SCHEMA_VERSION,
} from './types'

function isMfgMemoryEntry(entry: DecisionMemoryEntry): boolean {
  return (
    entry.companyId === MFG_MEMORY_COMPANY_ID &&
    entry.decisionType.startsWith(`${MFG_MEMORY_DECISION_PREFIX}:`)
  )
}

function toDecisionEntry(record: MemoryRecord): DecisionMemoryEntry {
  return {
    id: record.id,
    companyId: MFG_MEMORY_COMPANY_ID,
    userId: 'brain-memory-engine',
    decisionType: `${MFG_MEMORY_DECISION_PREFIX}:${record.module}:${record.event}`,
    context: JSON.stringify(record),
    actionTaken: record.decision,
    outcome:
      record.success === 'SUCCESS'
        ? 'SUCCESS'
        : record.success === 'PARTIAL'
          ? 'PARTIAL'
          : record.success === 'FAILURE'
            ? 'FAILED'
            : 'PENDING',
    outcomeNotes: record.finalOutcome,
    relatedOrderId: record.references.orderId,
    recordedAt: record.timestamp,
    tenantScoped: true,
  }
}

function fromDecisionEntry(entry: DecisionMemoryEntry): MemoryRecord | null {
  if (!isMfgMemoryEntry(entry)) return null
  try {
    const parsed = JSON.parse(entry.context) as MemoryRecord
    if (parsed?.schemaVersion !== MANUFACTURING_MEMORY_SCHEMA_VERSION) return null
    if (!parsed.id || !parsed.module) return null
    return parsed
  } catch {
    return null
  }
}

/** Append if id not already present — immutable journal. */
export function appendMemoryRecord(record: MemoryRecord): { appended: boolean; record: MemoryRecord } {
  const repo = brainDecisionMemoryRepo()
  if (repo.findById(DEFAULT_TENANT_ID, record.id)) {
    return { appended: false, record }
  }
  repo.saveEntry(DEFAULT_TENANT_ID, toDecisionEntry(record))
  return { appended: true, record }
}

export function appendMemoryRecords(records: MemoryRecord[]): {
  appended: number
  skipped: number
  total: number
} {
  let appended = 0
  let skipped = 0
  for (const r of records) {
    const result = appendMemoryRecord(r)
    if (result.appended) appended += 1
    else skipped += 1
  }
  return { appended, skipped, total: records.length }
}

/**
 * Append a correction without changing the original record.
 * The caller supplies a complete factual replacement record with a new id.
 */
export function appendMemoryCorrection(
  originalId: string,
  correction: MemoryRecord,
): { appended: boolean; record: MemoryRecord } {
  const original = getMemoryRecordById(originalId)
  if (!original) throw new Error(`Memory record not found: ${originalId}`)
  if (correction.id === originalId) {
    throw new Error('A correction must use a new immutable memory id')
  }
  return appendMemoryRecord({
    ...correction,
    correctionOf: originalId,
    traceId: original.traceId,
    links: [
      ...correction.links,
      { recordId: originalId, type: 'CORRECTS' },
    ],
  })
}

export function listAllMemoryRecords(): MemoryRecord[] {
  const entries = brainDecisionMemoryRepo().findByCompany(DEFAULT_TENANT_ID, MFG_MEMORY_COMPANY_ID)
  const out: MemoryRecord[] = []
  for (const e of entries) {
    const rec = fromDecisionEntry(e)
    if (rec) out.push(rec)
  }
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function getMemoryRecordById(id: string): MemoryRecord | null {
  const entry = brainDecisionMemoryRepo().findById(DEFAULT_TENANT_ID, id)
  return entry ? fromDecisionEntry(entry) : null
}
