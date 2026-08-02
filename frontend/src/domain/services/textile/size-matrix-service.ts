/**
 * Size Matrix — profesyonel Renk × Beden matrisi.
 */
import { sizeSetRepository } from '../../master-data'
import type { ColorSizeMatrix, MatrixTotals, ProductColor } from '../../types'
import type { SizeSetCategory, SizeSetEntity } from '../../types/textile-erp'

function inferCategory(productType: string, sizes: string[]): SizeSetCategory {
  if (/bebek|baby/i.test(productType)) return 'BABY'
  if (/çocuk|kids/i.test(productType)) return 'KIDS'
  if (sizes.every((s) => /^\d+$/.test(s) || s.includes('cm'))) return 'NUMERIC'
  if (sizes.some((s) => ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].includes(s))) return 'LETTER'
  return 'CUSTOM'
}

export function toSizeSetEntity(id: string): SizeSetEntity | undefined {
  const ss = sizeSetRepository.getById(id)
  if (!ss) return undefined
  return {
    id: ss.id,
    code: ss.code,
    name: ss.name,
    productType: ss.productType,
    category: inferCategory(ss.productType, ss.sizes),
    sizes: ss.sizes,
    status: ss.status,
  }
}

export function getAllSizeSets(): SizeSetEntity[] {
  return sizeSetRepository.getActive().map((s) => toSizeSetEntity(s.id)!)
}

export function buildColorSizeMatrix(
  colors: ProductColor[],
  sizeSetId: string,
  seed: number,
): ColorSizeMatrix {
  const sizeSet = sizeSetRepository.getById(sizeSetId)
  if (!sizeSet) return {}

  const matrix: ColorSizeMatrix = {}
  for (const color of colors.filter((c) => c.active)) {
    matrix[color.id] = {}
    for (const size of sizeSet.sizes) {
      matrix[color.id][size] = 80 + ((seed + size.length + color.id.length) % 12) * 35
    }
  }
  return matrix
}

export function computeMatrixTotals(
  colors: ProductColor[],
  sizeSetId: string,
  matrix: ColorSizeMatrix,
): MatrixTotals {
  const sizeSet = sizeSetRepository.getById(sizeSetId)
  const sizes = sizeSet?.sizes ?? []
  const byColor: Record<string, number> = {}
  const bySize: Record<string, number> = {}

  for (const color of colors.filter((c) => c.active)) {
    byColor[color.id] = 0
    for (const size of sizes) {
      const qty = matrix[color.id]?.[size] ?? 0
      byColor[color.id] += qty
      bySize[size] = (bySize[size] ?? 0) + qty
    }
  }

  return {
    byColor,
    bySize,
    grandTotal: Object.values(byColor).reduce((s, n) => s + n, 0),
  }
}

export function validateMatrixAgainstSizeSet(
  matrix: ColorSizeMatrix,
  sizeSetId: string,
): { valid: boolean; errors: string[] } {
  const sizeSet = sizeSetRepository.getById(sizeSetId)
  if (!sizeSet) return { valid: false, errors: ['Size set bulunamadı'] }
  const errors: string[] = []
  for (const colorId of Object.keys(matrix)) {
    for (const size of Object.keys(matrix[colorId])) {
      if (!sizeSet.sizes.includes(size)) {
        errors.push(`Geçersiz beden: ${size}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
