import type { EnterpriseTimelineEntry } from '@/domain/enterprise/types'
import type { IEnterpriseTimelineCollectionRepository } from '@/domain/ports/persistence/collections/enterprise-timeline-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class EnterpriseTimelineCollectionInMemoryRepository
  extends CollectionInMemoryRepository<EnterpriseTimelineEntry>
  implements IEnterpriseTimelineCollectionRepository
{
  findByEntity(_tenantId: string, entityType: string, entityId: string): EnterpriseTimelineEntry[] {
    return this.find(_tenantId, (e) => e.entityType === entityType && e.entityId === entityId)
  }

  prepend(_tenantId: string, entry: EnterpriseTimelineEntry): void {
    const all = this.findAll(_tenantId)
    all.unshift(entry)
    this.seedFromLegacy(_tenantId, all)
  }
}

export const enterpriseTimelineCollectionInMemory = new EnterpriseTimelineCollectionInMemoryRepository()
