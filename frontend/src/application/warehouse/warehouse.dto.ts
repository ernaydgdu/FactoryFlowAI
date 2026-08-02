import type { KpiDto, StatusBadgeDto } from '../core/types'

export type WarehouseHierarchyItemDto = {
  id: string
  code: string
  name: string
  type: string
  warehouseType: string
  parentId?: string
  depth: number
}

export type WarehouseTransactionItemDto = {
  id: string
  date: string
  type: string
  warehouse: string
  material: string
  qty: number
  unit: string
  status: StatusBadgeDto
}

export type WarehouseKpisDto = { items: KpiDto[] }
