import type { Comment } from '@/domain/platform/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface ICommentCollectionRepository extends ICollectionRepository<Comment> {
  findByEntity(tenantId: string, entityType: string, entityId: string): Comment[]
}
