import type { AuditAction, AuditLogEntry } from '../types'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../../ports/persistence/persistence-registry'
import type { PersistedAuditLogEntry } from '../../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../../ports/persistence/persistence.types'

export type AuditContext = {
  changedBy: string
  ip: string
  machine: string
  description?: string
}

function auditRepo() {
  return requireUnitOfWork().auditLog
}

function nextAuditId(): string {
  const all = auditRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return `aud-${String(all.items.length + 1).padStart(6, '0')}`
}

function auditStreamKey(entityType: string, entityId: string) {
  return { streamType: 'audit', streamId: `${entityType}:${entityId}` }
}

export function logAudit(
  entityType: string,
  entityId: string,
  action: AuditAction,
  context: AuditContext,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: nextAuditId(),
    entityType,
    entityId,
    action,
    changedBy: context.changedBy,
    changedAt: new Date().toISOString(),
    oldValue,
    newValue,
    ip: context.ip,
    machine: context.machine,
    description: context.description ?? `${action} — ${entityType} ${entityId}`,
  }
  const persisted: PersistedAuditLogEntry = {
    ...entry,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'audit',
    streamId: `${entityType}:${entityId}`,
    sequence: 0,
  }
  auditRepo().append(DEFAULT_TENANT_ID, auditStreamKey(entityType, entityId), [persisted])
  return entry
}

export function logCreate(
  entityType: string,
  entityId: string,
  context: AuditContext,
  newValue: Record<string, unknown>,
): AuditLogEntry {
  return logAudit(entityType, entityId, 'CREATE', context, null, newValue)
}

export function logUpdate(
  entityType: string,
  entityId: string,
  context: AuditContext,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
): AuditLogEntry {
  return logAudit(entityType, entityId, 'UPDATE', context, oldValue, newValue)
}

export function logApprove(
  entityType: string,
  entityId: string,
  context: AuditContext,
  newValue: Record<string, unknown>,
): AuditLogEntry {
  return logAudit(entityType, entityId, 'APPROVE', context, null, newValue)
}

export function getAuditTrail(entityType: string, entityId: string): AuditLogEntry[] {
  const page = auditRepo().cursorByEntity(DEFAULT_TENANT_ID, entityType, entityId, {
    limit: PERSISTENCE_CURSOR_MAX_LIMIT,
  })
  return page.items.map(stripAuditStreamMeta)
}

export function getAuditByUser(changedBy: string): AuditLogEntry[] {
  const page = auditRepo().cursorByUser(DEFAULT_TENANT_ID, changedBy, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripAuditStreamMeta)
}

export function getAllAuditLogs(): AuditLogEntry[] {
  const page = auditRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripAuditStreamMeta)
}

export function getChangedFields(
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
): { field: string; from: unknown; to: unknown }[] {
  const fields = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])
  const changes: { field: string; from: unknown; to: unknown }[] = []
  for (const field of fields) {
    if (JSON.stringify(oldValue[field]) !== JSON.stringify(newValue[field])) {
      changes.push({ field, from: oldValue[field], to: newValue[field] })
    }
  }
  return changes
}

export function seedAuditLogs(entries: AuditLogEntry[]): void {
  auditRepo().seedFromLegacyEntries(entries)
}

export function formatAuditEntry(entry: AuditLogEntry): string {
  const changes =
    entry.oldValue && entry.newValue
      ? getChangedFields(entry.oldValue, entry.newValue)
          .map((c) => `${c.field}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`)
          .join('; ')
      : entry.newValue
        ? `Yeni kayıt oluşturuldu`
        : 'Kayıt silindi'
  return `[${entry.changedAt}] ${entry.changedBy} @ ${entry.ip} (${entry.machine}): ${changes}`
}

function stripAuditStreamMeta(row: PersistedAuditLogEntry): AuditLogEntry {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}
