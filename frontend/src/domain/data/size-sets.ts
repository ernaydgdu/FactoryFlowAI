import type { SizeSet } from '../types'

export const SIZE_SETS: SizeSet[] = [
  { id: 'ss-1', code: 'SS-TSHIRT', name: 'T-Shirt Beden Seti', productType: 'Örme', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'ss-2', code: 'SS-PANT', name: 'Pantolon Beden Seti', productType: 'Dokuma', sizes: ['28', '29', '30', '31', '32'] },
  { id: 'ss-3', code: 'SS-BABY', name: 'Bebek Beden Seti', productType: 'Örme', sizes: ['0-3 Ay', '3-6 Ay', '6-9 Ay'] },
]

export function getSizeSetById(id: string): SizeSet | undefined {
  return SIZE_SETS.find((s) => s.id === id)
}

export function getSizeSetSizes(sizeSetId: string): string[] {
  return SIZE_SETS.find((s) => s.id === sizeSetId || s.code === sizeSetId)?.sizes ?? []
}
