/** Master Data change audit stream port */
import type { MasterDataChangeRecord } from '@/domain/master-data/enterprise/types'
import type { MasterDataEntityType } from '@/domain/master-data/types'

export interface IMasterDataChangeStreamRepository {
  append(tenantId: string, record: MasterDataChangeRecord): void
  findByEntity(tenantId: string, entityType: MasterDataEntityType, entityId: string): MasterDataChangeRecord[]
  findAll(tenantId: string): MasterDataChangeRecord[]
  nextChangeId(tenantId: string): string
  seedFromLegacy(tenantId: string, records: MasterDataChangeRecord[]): void
}
