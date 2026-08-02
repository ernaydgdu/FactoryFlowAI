/**
 * Warehouse enterprise relations — zones, locations, policies
 */
import { warehouseRepository } from '../../master-data'
import { WAREHOUSE_LOCATIONS, WAREHOUSE_ZONES } from '../enterprise-seed'
import type { EntityRelation, WarehouseRelations } from '../types'

function rel(fromId: string, toType: EntityRelation['toType'], toId: string, kind: EntityRelation['kind'], label: string): EntityRelation {
  return { id: `rel-wh-${fromId}-${toType}-${toId}`, fromType: 'WAREHOUSE', fromId, toType, toId, kind, label }
}

export function buildWarehouseRelations(warehouseId: string): WarehouseRelations | undefined {
  const wh = warehouseRepository.getById(warehouseId)
  if (!wh) return undefined

  const zones = WAREHOUSE_ZONES.filter((z) => z.warehouseId === warehouseId)
  const relations: EntityRelation[] = []

  for (const z of zones) {
    relations.push(rel(warehouseId, 'ZONE', z.id, 'CONTAINS', z.name))
    if (z.parentId) relations.push(rel(z.id, 'ZONE', z.parentId, 'BELONGS_TO', 'Parent Zone'))
  }

  for (const loc of WAREHOUSE_LOCATIONS) {
    relations.push(rel(warehouseId, 'LOCATION', loc.id, 'CONTAINS', loc.name))
    relations.push(rel(loc.id, 'ZONE', loc.zoneId, 'BELONGS_TO', 'Zone'))
  }

  relations.push(rel(warehouseId, 'WAREHOUSE', `${warehouseId}-policy`, 'REFERENCES', 'Stock Policy'))
  relations.push(rel(warehouseId, 'WAREHOUSE', `${warehouseId}-transfer`, 'REFERENCES', 'Transfer Rules'))

  return {
    rootType: 'WAREHOUSE',
    rootId: warehouseId,
    rootCode: wh.code,
    rootLabel: wh.name,
    relations,
    maxDepth: 3,
    zoneIds: zones.map((z) => z.id),
    locationIds: WAREHOUSE_LOCATIONS.map((l) => l.id),
  }
}

export function buildAllWarehouseRelations(): WarehouseRelations[] {
  return warehouseRepository.getActive().slice(0, 10).map((w) => buildWarehouseRelations(w.id)).filter((b): b is WarehouseRelations => !!b)
}
