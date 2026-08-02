import type { EntityTag, SystemTag } from '../types'

const tagStore: EntityTag[] = []
let counter = 0

export const SYSTEM_TAGS: SystemTag[] = [
  'VIP',
  'Acil',
  'Numune',
  'Tekrar Sipariş',
  'İhracat',
  'İç Piyasa',
  'Riskli',
]

export type ApplyTagInput = {
  entityType: string
  entityId: string
  tag: SystemTag
  appliedBy: string
}

export function applyTag(input: ApplyTagInput): EntityTag {
  const existing = tagStore.find(
    (t) => t.entityType === input.entityType && t.entityId === input.entityId && t.tag === input.tag,
  )
  if (existing) return existing

  counter += 1
  const entityTag: EntityTag = {
    id: `tag-${counter}`,
    ...input,
    appliedAt: new Date().toISOString(),
  }
  tagStore.push(entityTag)
  return entityTag
}

export function removeTag(entityType: string, entityId: string, tag: SystemTag): boolean {
  const idx = tagStore.findIndex(
    (t) => t.entityType === entityType && t.entityId === entityId && t.tag === tag,
  )
  if (idx === -1) return false
  tagStore.splice(idx, 1)
  return true
}

export function getTags(entityType: string, entityId: string): EntityTag[] {
  return tagStore.filter((t) => t.entityType === entityType && t.entityId === entityId)
}

export function getEntitiesByTag(tag: SystemTag): EntityTag[] {
  return tagStore.filter((t) => t.tag === tag)
}

export function seedTags(tags: EntityTag[]): void {
  tagStore.length = 0
  tagStore.push(...tags)
  counter = tags.length
}

export function getAllTags(): EntityTag[] {
  return [...tagStore]
}

export function hasTag(entityType: string, entityId: string, tag: SystemTag): boolean {
  return tagStore.some(
    (t) => t.entityType === entityType && t.entityId === entityId && t.tag === tag,
  )
}
