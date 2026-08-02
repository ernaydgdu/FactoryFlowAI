import type { AggregateRoot, ConcurrencyConflictError, CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'

export function paginate<T>(items: T[], page: CursorPage): PageResult<T> {
  const offset = page.cursor ? Number.parseInt(page.cursor, 10) : 0
  const slice = items.slice(offset, offset + page.limit)
  const next = offset + page.limit < items.length ? String(offset + page.limit) : undefined
  return { items: slice, nextCursor: next, hasMore: !!next }
}

export function conflictError(entity: string, id: string, expected: number, actual: number): ConcurrencyConflictError {
  return Object.assign(new Error(`Concurrency conflict on ${entity} ${id}`), {
    code: 'CONCURRENCY_CONFLICT' as const,
    entityId: id,
    expectedVersion: expected,
    actualVersion: actual,
  })
}

export function withPersistenceMetadata<T extends { id: string }>(
  item: T,
  tenantId: string,
  version = 1,
): T & Pick<AggregateRoot, 'tenantId' | 'version' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  const now = new Date().toISOString()
  return {
    ...item,
    tenantId,
    version,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}
