/**
 * Master Data lookup repository port — referans / lookup entity erişimi.
 * @see docs/architecture/PERSISTENCE-CONSTITUTION.md
 */
import type { BaseMasterEntity } from '@/domain/master-data/types'

export interface IMasterDataLookupRepository<T extends BaseMasterEntity> {
  getAll(tenantId: string): T[]
  getById(tenantId: string, id: string): T | undefined
  getByCode(tenantId: string, code: string): T | undefined
  getActive(tenantId: string): T[]
  find(tenantId: string, predicate: (entity: T) => boolean): T[]
  save(tenantId: string, entity: T): T
  seedFromLegacy(tenantId: string, entities: T[]): void
}
