/** Sprint 7 — PostgreSQL adapter module exports. */
export * from './postgres-config'
export * from './postgres-connection-pool'
export * from './postgres-migration-runner'
export * from './postgres-transaction-context'
export * from './async-unit-of-work-wrapper'
export * from './postgres-unit-of-work-factory'
export * from './postgres-not-implemented.error'
export * from './outbox/postgres-outbox.repository'
export * from './lookups/postgres-master-data-lookup-registry.stub'
export * from './collections/postgres-collection-repository.stub'
export * from './streams/postgres-audit-log-stream.stub'

export const POSTGRES_ADAPTER_SPRINT_MODULES = [
  '7.1 connection-pool + migration-runner + unit-of-work-factory',
  '7.2 async-unit-of-work-wrapper',
  '7.3 postgres-transaction-context',
  '7.4 postgres-outbox.repository',
  '7.5 postgres-master-data-lookup-registry.stub',
  '7.6 postgres-collection-repository.stub',
  '7.7 postgres-audit-log-stream + order-timeline stubs',
  '7.8 persistence-backend flag',
] as const
