import type { Attachment } from '@/domain/platform/types'
import type { IAttachmentCollectionRepository } from '@/domain/ports/persistence/collections/attachment-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class AttachmentCollectionInMemoryRepository
  extends CollectionInMemoryRepository<Attachment>
  implements IAttachmentCollectionRepository
{
  findByEntity(_tenantId: string, entityType: string, entityId: string): Attachment[] {
    return this.find(_tenantId, (a) => a.entityType === entityType && a.entityId === entityId)
  }
}

export const attachmentCollectionInMemory = new AttachmentCollectionInMemoryRepository()
