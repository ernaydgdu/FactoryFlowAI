import type { AiMemoryEntry } from '@/domain/platform/types'
import type { IAiMemoryCollectionRepository } from '@/domain/ports/persistence/collections/ai-memory-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class AiMemoryCollectionInMemoryRepository
  extends CollectionInMemoryRepository<AiMemoryEntry>
  implements IAiMemoryCollectionRepository
{
  findByEntityId(_tenantId: string, entityId: string): AiMemoryEntry[] {
    return this.find(_tenantId, (e) => e.entityId === entityId).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    )
  }
}

export const aiMemoryCollectionInMemory = new AiMemoryCollectionInMemoryRepository()
