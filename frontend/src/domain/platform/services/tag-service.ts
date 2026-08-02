import { DEFAULT_TENANT_ID, entityTagsRepo } from '../platform-persistence-access'
import type { EntityTag, SystemTag } from '../types'

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
  const repo = entityTagsRepo()
  const existing = repo.find(
    DEFAULT_TENANT_ID,
    (t) => t.entityType === input.entityType && t.entityId === input.entityId && t.tag === input.tag,
  )[0]
  if (existing) return existing

  const counter = repo.nextCounter(DEFAULT_TENANT_ID)
  const entityTag: EntityTag = {
    id: `tag-${counter}`,
    ...input,
    appliedAt: new Date().toISOString(),
  }
  repo.save(DEFAULT_TENANT_ID, entityTag)
  return entityTag
}

export function removeTag(entityType: string, entityId: string, tag: SystemTag): boolean {
  const repo = entityTagsRepo()
  const match = repo.find(
    DEFAULT_TENANT_ID,
    (t) => t.entityType === entityType && t.entityId === entityId && t.tag === tag,
  )[0]
  if (!match) return false
  return repo.remove(DEFAULT_TENANT_ID, match.id)
}

export function getTags(entityType: string, entityId: string): EntityTag[] {
  return entityTagsRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)
}

export function getEntitiesByTag(tag: SystemTag): EntityTag[] {
  return entityTagsRepo().find(DEFAULT_TENANT_ID, (t) => t.tag === tag)
}

export function seedTags(tags: EntityTag[]): void {
  const repo = entityTagsRepo()
  repo.seedFromLegacy(DEFAULT_TENANT_ID, tags)
  repo.setCounter(DEFAULT_TENANT_ID, tags.length)
}

export function getAllTags(): EntityTag[] {
  return entityTagsRepo().findAll(DEFAULT_TENANT_ID)
}

export function hasTag(entityType: string, entityId: string, tag: SystemTag): boolean {
  return entityTagsRepo().find(
    DEFAULT_TENANT_ID,
    (t) => t.entityType === entityType && t.entityId === entityId && t.tag === tag,
  ).length > 0
}
