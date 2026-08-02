/** Master Data brain change feed stream port */
import type { MasterDataBrainChangeEvent } from '@/domain/master-data/enterprise/types'

export interface IMasterDataBrainChangeStreamRepository {
  publish(tenantId: string, event: MasterDataBrainChangeEvent): void
  getFeed(tenantId: string, limit?: number): MasterDataBrainChangeEvent[]
  getAll(tenantId: string): MasterDataBrainChangeEvent[]
  seedFromLegacy(tenantId: string, events: MasterDataBrainChangeEvent[]): void
}
