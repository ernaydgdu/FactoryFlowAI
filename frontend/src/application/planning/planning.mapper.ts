import { SIZE_SETS } from '@/domain/data/size-sets'

import type { PlanningKpisDto, SizeSetListItemDto } from './planning.dto'

export function mapSizeSetList(): SizeSetListItemDto[] {
  return SIZE_SETS.map((s) => ({
    id: s.id,
    name: s.name,
    productType: s.productType,
    sizes: s.sizes,
  }))
}

export function mapPlanningKpis(): PlanningKpisDto {
  return {
    items: [
      { label: 'Beden Seti', value: String(SIZE_SETS.length), hint: 'Tanımlı' },
    ],
  }
}
