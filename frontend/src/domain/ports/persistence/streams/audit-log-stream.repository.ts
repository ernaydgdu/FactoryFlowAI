/** P20 — AuditLog stream port */
import type { AuditLogEntry } from '@/domain/platform/types'

import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedAuditLogEntry } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IAuditLogStreamRepository extends IStreamRepository<PersistedAuditLogEntry> {
  cursorByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
    page: CursorPage,
  ): PageResult<PersistedAuditLogEntry>
  cursorByUser(tenantId: string, userId: string, page: CursorPage): PageResult<PersistedAuditLogEntry>
  cursorByDateRange(
    tenantId: string,
    from: string,
    to: string,
    page: CursorPage,
  ): PageResult<PersistedAuditLogEntry>
  seedFromLegacyEntries(entries: AuditLogEntry[]): void
}
