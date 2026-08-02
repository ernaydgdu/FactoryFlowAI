import type { Comment, CommentEntityType } from '../types'

const commentStore: Comment[] = []
let counter = 0

export type AddCommentInput = {
  entityType: CommentEntityType
  entityId: string
  entityNo: string
  author: string
  authorRole: string
  body: string
}

export function addComment(input: AddCommentInput): Comment {
  counter += 1
  const comment: Comment = {
    id: `cmt-${counter}`,
    ...input,
    createdAt: new Date().toISOString(),
  }
  commentStore.push(comment)
  return comment
}

export function getComments(entityType: CommentEntityType, entityId: string): Comment[] {
  return commentStore
    .filter((c) => c.entityType === entityType && c.entityId === entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function editComment(id: string, body: string): Comment | null {
  const comment = commentStore.find((c) => c.id === id)
  if (!comment) return null
  comment.body = body
  comment.editedAt = new Date().toISOString()
  return comment
}

export function seedComments(comments: Comment[]): void {
  commentStore.length = 0
  commentStore.push(...comments)
  counter = comments.length
}

export function getAllComments(): Comment[] {
  return [...commentStore]
}

export function getRecentComments(limit = 10): Comment[] {
  return [...commentStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}
