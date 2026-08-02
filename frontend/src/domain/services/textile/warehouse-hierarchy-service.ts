/**
 * Warehouse Hierarchy — hiyerarşik depo yapısı.
 */
import { warehouseRepository } from '../../master-data'
import type { WarehouseHierarchyNode } from '../../types/textile-erp'

export function buildWarehouseHierarchy(): WarehouseHierarchyNode[] {
  const warehouses = warehouseRepository.getActive()
  const nodes: WarehouseHierarchyNode[] = []
  const groups = new Map<string, string>()

  for (const wh of warehouses) {
    if (wh.hierarchyGroup === 'ROOT') {
      const nodeId = `wh-node-${wh.id}`
      groups.set(wh.hierarchyGroup + wh.code, nodeId)
      nodes.push({
        id: nodeId,
        code: wh.code,
        name: wh.name,
        type: 'GROUP',
        warehouseType: wh.type,
        childIds: [],
        sortOrder: nodes.length,
      })
    }
  }

  for (const wh of warehouses) {
    if (wh.hierarchyGroup === 'ROOT') continue
    const nodeId = `wh-node-${wh.id}`
    const parentKey = wh.parentId ? `wh-node-${wh.parentId}` : undefined
    const node: WarehouseHierarchyNode = {
      id: nodeId,
      code: wh.code,
      name: wh.name,
      type: 'WAREHOUSE',
      warehouseType: wh.type,
      parentId: parentKey,
      childIds: [],
      warehouseCode: wh.code,
      sortOrder: nodes.length,
    }
    nodes.push(node)
    if (parentKey) {
      const parent = nodes.find((n) => n.id === parentKey)
      if (parent) parent.childIds.push(nodeId)
    }
  }

  return nodes
}

export function getWarehousePath(warehouseCode: string): string[] {
  const wh = warehouseRepository.getByCode(warehouseCode)
  if (!wh) return [warehouseCode]
  const path = [wh.name]
  if (wh.parentId) {
    const parent = warehouseRepository.getById(wh.parentId)
    if (parent) path.unshift(parent.name)
    if (parent?.hierarchyGroup) path.unshift(parent.hierarchyGroup)
  } else if (wh.hierarchyGroup) {
    path.unshift(wh.hierarchyGroup)
  }
  return path
}

export function getWarehousesByGroup(group: string): string[] {
  return warehouseRepository
    .getActive()
    .filter((w) => w.hierarchyGroup === group)
    .map((w) => w.code)
}

export function getProductionWarehouseCodes(): string[] {
  return getWarehousesByGroup('Atölye').concat(getWarehousesByGroup('Üretim'))
}

export function getFinishingWarehouseCodes(): string[] {
  return getWarehousesByGroup('Finishing')
}
