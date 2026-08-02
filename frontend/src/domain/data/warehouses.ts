import type { Warehouse as LegacyWarehouse, WarehouseType } from '../types'
import { warehouseRepository, warehouseTypeRepository } from '../master-data'
import { lazyArray } from './lazy-cache'

function resolveWarehouseType(w: { type?: WarehouseType; warehouseTypeId: string }): WarehouseType {
  if (w.type) return w.type
  const wt = warehouseTypeRepository.getById(w.warehouseTypeId)
  return (wt?.legacyType ?? 'Hammadde') as WarehouseType
}

/** Geriye dönük uyumluluk — master data warehouse → legacy format */
export const WAREHOUSES = lazyArray((): LegacyWarehouse[] =>
  warehouseRepository.getActive().map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    type: resolveWarehouseType(w),
    location: w.location,
  })),
)

export { getWarehouseByCode, getWarehouseName } from '../master-data'

export function getWarehouseById(id: string): LegacyWarehouse | undefined {
  const w = warehouseRepository.getById(id)
  if (!w) return undefined
  return { id: w.id, code: w.code, name: w.name, type: resolveWarehouseType(w), location: w.location }
}
