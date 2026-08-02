import type { EntityTag } from '@/domain/platform/types'
import type { IEntityTagCollectionRepository } from '@/domain/ports/persistence/collections/entity-tag-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class EntityTagCollectionInMemoryRepository
  extends CollectionInMemoryRepository<EntityTag>
  implements IEntityTagCollectionRepository
{
  findByEntity(_tenantId: string, entityType: string, entityId: string): EntityTag[] {
    return this.find(_tenantId, (t) => t.entityType === entityType && t.entityId === entityId)
  }
}

export const entityTagCollectionInMemory = new EntityTagCollectionInMemoryRepository()
