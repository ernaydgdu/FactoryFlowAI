/**
 * Sprint 7.2 — async UoW wrapper skeleton.
 * Sync port surface stays; PG adapter will wrap factory calls in Promise boundaries.
 */
import type { IUnitOfWork, IUnitOfWorkFactory } from '@/domain/ports/persistence/unit-of-work.port'

import { PostgresAdapterNotReadyError } from './postgres-not-implemented.error'

export type AsyncUnitOfWorkFactory = {
  create(): Promise<IUnitOfWork>
}

export function wrapUnitOfWorkFactoryAsync(
  factory: IUnitOfWorkFactory,
): AsyncUnitOfWorkFactory {
  return {
    create: () => Promise.resolve(factory.create()),
  }
}

/** Future PG path — resolves when postgres factory is wired. */
export async function createPostgresUnitOfWorkAsync(): Promise<IUnitOfWork> {
  throw new PostgresAdapterNotReadyError('async-unit-of-work-wrapper.createPostgres')
}
