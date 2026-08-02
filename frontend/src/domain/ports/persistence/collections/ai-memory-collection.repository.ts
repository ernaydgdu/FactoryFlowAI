import type { AiMemoryEntry } from '@/domain/platform/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IAiMemoryCollectionRepository extends ICollectionRepository<AiMemoryEntry> {
  findByEntityId(tenantId: string, entityId: string): AiMemoryEntry[]
}
