import type { CursorPage, PageResult, StreamKey } from '@/domain/ports/persistence/persistence.types'
import type { PersistedAuditLogEntry } from '@/domain/ports/persistence/persistence-aggregates'
import type { IAuditLogStreamRepository } from '@/domain/ports/persistence/streams/audit-log-stream.repository'
import type { AuditLogEntry } from '@/domain/platform/types'

import { inMemoryStoreRegistry, type InMemoryStoreRegistry } from '../store-registry'

export class AuditLogInMemoryStreamRepository implements IAuditLogStreamRepository {
  private readonly stores: InMemoryStoreRegistry

  constructor(stores: InMemoryStoreRegistry = inMemoryStoreRegistry) {
    this.stores = stores
  }

  append(tenantId: string, streamKey: StreamKey, events: PersistedAuditLogEntry[]): void {
    for (const event of events) {
      this.stores.auditCounter += 1
      this.stores.auditLogs.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.stores.auditCounter,
      })
    }
  }

  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): PersistedAuditLogEntry[] {
    return this.stores.auditLogs.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedAuditLogEntry> {
    let items = this.stores.auditLogs.filter((e) => e.tenantId === tenantId)
    const entityType = filter.entityType as string | undefined
    const entityId = filter.entityId as string | undefined
    const changedBy = filter.changedBy as string | undefined
    if (entityType) items = items.filter((e) => e.entityType === entityType)
    if (entityId) items = items.filter((e) => e.entityId === entityId)
    if (changedBy) items = items.filter((e) => e.changedBy === changedBy)
    items = items.sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  latest(tenantId: string, streamKey: StreamKey, count: number): PersistedAuditLogEntry[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.stores.auditLogs.some((e) => e.id === eventId)
  }

  cursorByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
    page: CursorPage,
  ): PageResult<PersistedAuditLogEntry> {
    return this.cursor(tenantId, { entityType, entityId }, page)
  }

  cursorByUser(tenantId: string, userId: string, page: CursorPage): PageResult<PersistedAuditLogEntry> {
    return this.cursor(tenantId, { changedBy: userId }, page)
  }

  cursorByDateRange(
    tenantId: string,
    from: string,
    to: string,
    page: CursorPage,
  ): PageResult<PersistedAuditLogEntry> {
    let items = this.stores.auditLogs.filter(
      (e) => e.tenantId === tenantId && e.changedAt >= from && e.changedAt <= to,
    )
    items = items.sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
    const slice = items.slice(offset, offset + page.limit)
    const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
    return { items: slice, nextCursor: next, hasMore: !!next }
  }

  replaceAll(entries: AuditLogEntry[]): void {
    this.stores.seedAuditLogs(entries)
  }

  seedFromLegacyEntries(entries: AuditLogEntry[]): void {
    this.replaceAll(entries)
  }

  allAsLegacy(): AuditLogEntry[] {
    return this.stores.auditLogs.map(
      ({ tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest }) => rest as AuditLogEntry,
    )
  }
}
