/**
 * Sprint 7.1 — PostgreSQL UnitOfWork factory skeleton.
 * create() validates pool config then throws until adapter modules are wired.
 */
import type { IUnitOfWork, IUnitOfWorkFactory } from '@/domain/ports/persistence/unit-of-work.port'

import { configurePostgresPool } from './postgres-connection-pool'
import { PostgresAdapterNotReadyError } from './postgres-not-implemented.error'

export class PostgresUnitOfWorkFactory implements IUnitOfWorkFactory {
  create(): IUnitOfWork {
    configurePostgresPool()
    throw new PostgresAdapterNotReadyError('postgres-unit-of-work-factory.create')
  }
}

export const postgresUnitOfWorkFactory = new PostgresUnitOfWorkFactory()
