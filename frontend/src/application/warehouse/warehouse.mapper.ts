import { buildWarehouseHierarchy } from '@/domain/services/textile/warehouse-hierarchy-service'

import {
  mapInventoryCycleCounts,
  mapInventoryInbound,
  mapInventoryKpis,
  mapInventoryOutbound,
} from '@/application/inventory/inventory.mapper'

import type { WarehouseHierarchyItemDto, WarehouseKpisDto, WarehouseTransactionItemDto } from './warehouse.dto'

export function mapWarehouseHierarchy(): WarehouseHierarchyItemDto[] {
  const nodes = buildWarehouseHierarchy()
  const depthMap = new Map<string, number>()

  function depth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!
    const node = nodes.find((n) => n.id === id)
    if (!node?.parentId) {
      depthMap.set(id, 0)
      return 0
    }
    const d = depth(node.parentId) + 1
    depthMap.set(id, d)
    return d
  }

  return nodes.map((n) => ({
    id: n.id,
    code: n.code,
    name: n.name,
    type: n.type,
    warehouseType: n.warehouseType ?? '—',
    parentId: n.parentId,
    depth: depth(n.id),
  }))
}

function toTransaction(
  row: ReturnType<typeof mapInventoryInbound>[number],
): WarehouseTransactionItemDto {
  return {
    id: row.id,
    date: row.date,
    type: row.typeLabel,
    warehouse: row.warehouse,
    material: row.material,
    qty: row.qty,
    unit: row.unit,
    status: row.status,
  }
}

export function mapWarehouseInbound(): WarehouseTransactionItemDto[] {
  return mapInventoryInbound().map(toTransaction)
}

export function mapWarehouseOutbound(): WarehouseTransactionItemDto[] {
  return mapInventoryOutbound().map(toTransaction)
}

export function mapWarehouseCount(): WarehouseTransactionItemDto[] {
  return mapInventoryCycleCounts().map(toTransaction)
}

export function mapWarehouseKpis(): WarehouseKpisDto {
  const kpis = mapInventoryKpis()
  return { items: kpis.items }
}
