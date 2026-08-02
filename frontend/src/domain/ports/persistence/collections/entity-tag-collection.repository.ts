import type { EntityTag } from '@/domain/platform/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IEntityTagCollectionRepository extends ICollectionRepository<EntityTag> {
  findByEntity(tenantId: string, entityType: string, entityId: string): EntityTag[]
}
