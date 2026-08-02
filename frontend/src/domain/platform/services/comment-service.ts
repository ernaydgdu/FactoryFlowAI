import { commentsRepo, DEFAULT_TENANT_ID } from '../platform-persistence-access'
import type { Comment, CommentEntityType } from '../types'

export type AddCommentInput = {
  entityType: CommentEntityType
  entityId: string
  entityNo: string
  author: string
  authorRole: string
  body: string
}

export function addComment(input: AddCommentInput): Comment {
  const repo = commentsRepo()
  const counter = repo.nextCounter(DEFAULT_TENANT_ID)
  const comment: Comment = {
    id: `cmt-${counter}`,
    ...input,
    createdAt: new Date().toISOString(),
  }
  repo.save(DEFAULT_TENANT_ID, comment)
  return comment
}

export function getComments(entityType: CommentEntityType, entityId: string): Comment[] {
  return commentsRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)
}

export function editComment(id: string, body: string): Comment | null {
  const repo = commentsRepo()
  const comment = repo.findById(DEFAULT_TENANT_ID, id)
  if (!comment) return null
  const updated: Comment = {
    ...comment,
    body,
    editedAt: new Date().toISOString(),
  }
  repo.save(DEFAULT_TENANT_ID, updated)
  return updated
}

export function seedComments(comments: Comment[]): void {
  const repo = commentsRepo()
  repo.seedFromLegacy(DEFAULT_TENANT_ID, comments)
  repo.setCounter(DEFAULT_TENANT_ID, comments.length)
}

export function getAllComments(): Comment[] {
  return commentsRepo().findAll(DEFAULT_TENANT_ID)
}

export function getRecentComments(limit = 10): Comment[] {
  return [...commentsRepo().findAll(DEFAULT_TENANT_ID)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}
