/**
 * Color Management — Color Card entity ve sipariş renk atamaları.
 */
import { colorCardRepository } from '../../master-data'
import type { ColorCardEntity, ProductColorAssignment } from '../../types/textile-erp'
import type { ProductColor } from '../../types'

export function toColorCardEntity(id: string): ColorCardEntity | undefined {
  const card = colorCardRepository.getById(id)
  if (!card) return undefined
  return {
    id: card.id,
    code: card.code,
    name: card.name,
    pantone: card.pantone,
    customerColorCode: card.customerColorCode ?? card.customerCode ?? '',
    internalColorCode: card.internalColorCode,
    description: card.description ?? '',
    rgb: card.rgb,
    hex: card.hex,
    colorGroupId: card.colorGroup,
    status: card.status,
  }
}

export function getAllColorCards(): ColorCardEntity[] {
  return colorCardRepository.getActive().map((c) => toColorCardEntity(c.id)!)
}

export function buildProductColorAssignments(count: number, seed: number): ProductColorAssignment[] {
  const active = colorCardRepository.getActive()
  const take = Math.min(count, active.length)
  return active.slice(0, take).map((c, i) => ({
    id: `pca-${seed}-${i}`,
    colorCardId: c.id,
    sortOrder: i + 1,
    active: true,
  }))
}

export function toLegacyProductColors(assignments: ProductColorAssignment[]): ProductColor[] {
  return assignments
    .filter((a) => a.active)
    .map((a) => {
      const card = colorCardRepository.getById(a.colorCardId)
      return {
        id: a.id,
        colorCardId: a.colorCardId,
        name: card?.name ?? a.colorCardId,
        internalCode: card?.internalColorCode ?? '',
        customerCode: card?.customerColorCode ?? card?.customerCode ?? '',
        pantone: card?.pantone ?? '',
        colorGroup: card?.colorGroup ?? '',
        active: a.active,
      }
    })
}

export function resolveColorForMatrix(colorCardId: string): { label: string; hex: string } {
  const card = colorCardRepository.getById(colorCardId)
  return { label: card?.name ?? colorCardId, hex: card?.hex ?? '#000000' }
}
