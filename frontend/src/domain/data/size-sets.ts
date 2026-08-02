import type { SizeSet } from '../types'
import { sizeSetRepository } from '../master-data'
import { lazyArray } from './lazy-cache'

export const SIZE_SETS = lazyArray((): SizeSet[] =>
  sizeSetRepository.getActive().map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    productType: s.productType,
    sizes: s.sizes,
  })),
)

export { getSizeSetById, getSizeSetSizes } from '../master-data'
