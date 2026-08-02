import type { EnterpriseTimelineEntry } from '@/domain/enterprise/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IEnterpriseTimelineCollectionRepository extends ICollectionRepository<EnterpriseTimelineEntry> {
  findByEntity(tenantId: string, entityType: string, entityId: string): EnterpriseTimelineEntry[]
  prepend(tenantId: string, entry: EnterpriseTimelineEntry): void
}
