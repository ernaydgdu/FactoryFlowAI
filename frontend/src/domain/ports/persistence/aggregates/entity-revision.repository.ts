/** P19 — EntityRevision aggregate port */
import type { VersionedEntityType, VersionedRecord } from '../../../platform/types'
import type { PersistedEntityRevision } from '../persistence-aggregates'
import type { IAggregateRepository } from '../repository.base'

export interface IEntityRevisionRepository extends IAggregateRepository<PersistedEntityRevision> {
  findByEntity(tenantId: string, entityType: VersionedEntityType, entityId: string): PersistedEntityRevision[]
  findActive(tenantId: string, entityType: VersionedEntityType, entityId: string): PersistedEntityRevision | null
  seedFromLegacy(records: VersionedRecord[]): void
}
