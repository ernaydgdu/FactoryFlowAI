/**
 * Repository base port interfaces — yalnızca sözleşme, implementasyon yok.
 * InMemory adapter senkron; PostgreSQL adapter Sprint 6'da async wrapper kullanabilir.
 * @see docs/architecture/PERSISTENCE-CONSTITUTION.md §1
 */
import type {
  AggregateRoot,
  CursorPage,
  OutboxEnqueueInput,
  OutboxMessage,
  PageResult,
  SaveOptions,
  StreamKey,
  StreamRecord,
} from './persistence.types'

/** Aggregate Root — OLTP, versioned */
export interface IAggregateRepository<T extends AggregateRoot> {
  findById(tenantId: string, id: string): T | null
  findByIdForUpdate(tenantId: string, id: string): T | null
  save(tenantId: string, aggregate: T, options?: SaveOptions): T
  delete(tenantId: string, id: string): void
  exists(tenantId: string, id: string): boolean
  version(tenantId: string, id: string): number
  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<T>
}

/** Natural key (`code` / `*No`) olan aggregate'ler */
export interface ICodedAggregateRepository<T extends AggregateRoot> extends IAggregateRepository<T> {
  findByCode(tenantId: string, code: string): T | null
}

/** Append-only stream */
export interface IStreamRepository<T extends StreamRecord> {
  append(tenantId: string, streamKey: StreamKey, events: T[]): void
  stream(tenantId: string, streamKey: StreamKey, fromSequence: number): T[]
  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<T>
  latest(tenantId: string, streamKey: StreamKey, count: number): T[]
  exists(tenantId: string, eventId: string): boolean
}

/** Derived / materialized read model */
export interface IReadModelRepository<T> {
  get(tenantId: string, key: string): T | null
  refresh(tenantId: string, sourceKey: string): void
  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<T>
}

/** Domain event outbox — TX içi enqueue, TX dışı dispatch */
export interface IOutboxRepository {
  enqueue(tenantId: string, messages: OutboxEnqueueInput[]): void
  claimPending(tenantId: string, batchSize: number): OutboxMessage[]
  markPublished(tenantId: string, messageIds: string[]): void
  markFailed(tenantId: string, messageId: string, error: string): void
  cursor(tenantId: string, filter: Record<string, unknown>, page: CursorPage): PageResult<OutboxMessage>
}
