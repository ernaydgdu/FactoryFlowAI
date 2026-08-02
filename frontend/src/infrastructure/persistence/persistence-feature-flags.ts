/**
 * Persistence runtime feature flags — infrastructure batch settings.
 */
export { PERSISTENCE_WIP_SYNC_FALLBACK } from '@/domain/ports/persistence/persistence-feature-flags'

export { getPersistenceBackend, isPostgresBackend, type PersistenceBackend } from './persistence-backend'

/** Outbox worker batch size per flush cycle. */
export const OUTBOX_WORKER_BATCH_SIZE = 50
