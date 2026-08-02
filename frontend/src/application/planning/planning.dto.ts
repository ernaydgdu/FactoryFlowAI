import type { KpiDto } from '../core/types'

export type SizeSetListItemDto = {
  id: string
  name: string
  productType: string
  sizes: string[]
}

export type PlanningKpisDto = { items: KpiDto[] }
