import type { Attachment } from '@/domain/platform/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IAttachmentCollectionRepository extends ICollectionRepository<Attachment> {
  findByEntity(tenantId: string, entityType: string, entityId: string): Attachment[]
}
