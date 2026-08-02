import {
  mapWarehouseCount,
  mapWarehouseHierarchy,
  mapWarehouseInbound,
  mapWarehouseKpis,
  mapWarehouseOutbound,
} from './warehouse.mapper'

export const warehouseApplicationService = {
  getHierarchy: mapWarehouseHierarchy,
  getInbound: mapWarehouseInbound,
  getOutbound: mapWarehouseOutbound,
  getCount: mapWarehouseCount,
  getKpis: mapWarehouseKpis,
}
