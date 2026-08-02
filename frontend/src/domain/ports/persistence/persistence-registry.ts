/**
 * Persistence registry — domain tarafında UoW erişimi.
 * Infrastructure bootstrap'ta register edilir; domain infra import etmez.
 */
import type { IUnitOfWork, IUnitOfWorkFactory } from './unit-of-work.port'

let factory: IUnitOfWorkFactory | null = null
let sharedUnitOfWork: IUnitOfWork | null = null

export const DEFAULT_TENANT_ID = 'kepler-default'

export function registerUnitOfWorkFactory(unitOfWorkFactory: IUnitOfWorkFactory): void {
  factory = unitOfWorkFactory
  sharedUnitOfWork = unitOfWorkFactory.create()
}

export function requireUnitOfWorkFactory(): IUnitOfWorkFactory {
  if (!factory) {
    throw new Error('Persistence not initialized — call ensurePersistenceBootstrapped() first.')
  }
  return factory
}

export function requireUnitOfWork(): IUnitOfWork {
  if (!sharedUnitOfWork) {
    requireUnitOfWorkFactory()
  }
  return sharedUnitOfWork!
}

export function resetPersistenceForTests(): void {
  factory = null
  sharedUnitOfWork = null
}
