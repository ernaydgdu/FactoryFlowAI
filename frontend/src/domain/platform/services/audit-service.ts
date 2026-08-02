import type { AuditAction, AuditLogEntry } from '../types'

export type AuditContext = {
  changedBy: string
  ip: string
  machine: string
  description?: string
}

const auditStore: AuditLogEntry[] = []
let auditCounter = 0

function nextAuditId(): string {
  auditCounter += 1
  return `aud-${String(auditCounter).padStart(6, '0')}`
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
  auditStore.push(entry)
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
  return auditStore
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
}

export function getAuditByUser(changedBy: string): AuditLogEntry[] {
  return auditStore.filter((e) => e.changedBy === changedBy)
}

export function getAllAuditLogs(): AuditLogEntry[] {
  return [...auditStore]
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
  auditStore.length = 0
  auditStore.push(...entries)
  auditCounter = entries.length
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
