import type { HumanFeedbackEntry } from '@/domain/brain/twin/types'
import type { IHumanFeedbackCollectionRepository } from '@/domain/ports/persistence/collections/human-feedback-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class HumanFeedbackCollectionInMemoryRepository
  extends CollectionInMemoryRepository<HumanFeedbackEntry>
  implements IHumanFeedbackCollectionRepository
{
  findByCompany(_tenantId: string, companyId: string): HumanFeedbackEntry[] {
    return this.find(_tenantId, (f) => f.companyId === companyId).sort((a, b) =>
      b.recordedAt.localeCompare(a.recordedAt),
    )
  }
}

export const humanFeedbackCollectionInMemory = new HumanFeedbackCollectionInMemoryRepository()
