/**
 * Persistence port — ortak tipler (database-agnostic).
 * @see docs/architecture/PERSISTENCE-CONSTITUTION.md
 */

/** JSON payload — adapter dialect-specific tip kullanmaz */
export type JsonObject = Record<string, unknown>

/** Tüm Aggregate Root'ların persistence metadata'sı */
export type AggregateRoot = {
  id: string
  tenantId: string
  version: number
  schemaVersion: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

/** Append-only stream kayıtları */
export type StreamRecord = {
  id: string
  tenantId: string
  streamType: string
  streamId: string
  sequence: number
}

/** Constitution — max page size */
export const PERSISTENCE_CURSOR_MAX_LIMIT = 100 as const

export type CursorPage = {
  cursor?: string
  limit: number
  sort?: string
}

export type PageResult<T> = {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export type StreamKey = {
  streamType: string
  streamId: string
}

export type SaveOptions = {
  expectedVersion?: number
}

/** Optimistic lock conflict — adapter fırlatır, domain yakalar */
export type ConcurrencyConflictError = Error & {
  readonly code: 'CONCURRENCY_CONFLICT'
  readonly entityId: string
  readonly expectedVersion: number
  readonly actualVersion: number
}

export type OutboxHandler =
  | 'brain'
  | 'dashboard'
  | 'notification'
  | 'digital-twin'
  | 'wip-refresh'
  | 'ai-memory'

export type OutboxMessage = StreamRecord & {
  aggregateType: string
  aggregateId: string
  eventType: string
  payload: JsonObject
  correlationId: string
  causationId?: string
  createdAt: string
  publishedAt?: string | null
  publishAttempts: number
  lastError?: string | null
  targetHandlers: OutboxHandler[]
}

export type OutboxEnqueueInput = Omit<
  OutboxMessage,
  'sequence' | 'publishedAt' | 'publishAttempts' | 'lastError'
> & {
  id: string
}
