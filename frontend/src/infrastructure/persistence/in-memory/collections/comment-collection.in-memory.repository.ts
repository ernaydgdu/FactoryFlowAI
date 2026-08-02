import type { Comment } from '@/domain/platform/types'
import type { ICommentCollectionRepository } from '@/domain/ports/persistence/collections/comment-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class CommentCollectionInMemoryRepository
  extends CollectionInMemoryRepository<Comment>
  implements ICommentCollectionRepository
{
  findByEntity(_tenantId: string, entityType: string, entityId: string): Comment[] {
    return this.find(_tenantId, (c) => c.entityType === entityType && c.entityId === entityId).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    )
  }
}

export const commentCollectionInMemory = new CommentCollectionInMemoryRepository()
