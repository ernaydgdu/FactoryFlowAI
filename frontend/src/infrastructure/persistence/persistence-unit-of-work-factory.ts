import type { IUnitOfWorkFactory } from '@/domain/ports/persistence/unit-of-work.port'

import { InMemoryUnitOfWorkFactory } from './in-memory/in-memory-unit-of-work'
import { getPersistenceBackend } from './persistence-backend'
import { postgresUnitOfWorkFactory } from './postgresql/postgres-unit-of-work-factory'

export function resolveUnitOfWorkFactory(): IUnitOfWorkFactory {
  return getPersistenceBackend() === 'postgres'
    ? postgresUnitOfWorkFactory
    : new InMemoryUnitOfWorkFactory()
}
