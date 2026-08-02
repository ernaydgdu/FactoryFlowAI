import type { HumanFeedbackEntry } from '@/domain/brain/twin/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IHumanFeedbackCollectionRepository extends ICollectionRepository<HumanFeedbackEntry> {
  findByCompany(tenantId: string, companyId: string): HumanFeedbackEntry[]
}
