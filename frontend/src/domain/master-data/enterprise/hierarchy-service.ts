import type { BaseMasterEntity } from '../types'
import type { HierarchyEntityType } from './types'
import { productGroupRepository, warehouseRepository, operationRepository, accessoryCategoryRepository, countryRepository } from '../repositories'
import {
  ENTERPRISE_CUSTOMER_GROUPS,
  ENTERPRISE_DEPARTMENTS,
  ENTERPRISE_FABRIC_CATEGORIES,
  ENTERPRISE_MACHINE_GROUPS,
  ENTERPRISE_SUPPLIER_GROUPS,
} from './enterprise-seed'

type HierarchyNode = {
  entityType: HierarchyEntityType
  entity: BaseMasterEntity & { parentId?: string }
  children: HierarchyNode[]
}

const HIERARCHY_REPOS: Partial<Record<HierarchyEntityType, { getAll(): Array<BaseMasterEntity & { parentId?: string }> }>> = {
  productGroup: productGroupRepository,
  warehouse: warehouseRepository,
  operation: operationRepository,
  accessoryCategory: accessoryCategoryRepository,
  fabricCategory: { getAll: () => ENTERPRISE_FABRIC_CATEGORIES },
  customerGroup: { getAll: () => ENTERPRISE_CUSTOMER_GROUPS },
  supplierGroup: { getAll: () => ENTERPRISE_SUPPLIER_GROUPS },
  country: countryRepository,
  department: { getAll: () => ENTERPRISE_DEPARTMENTS },
  machineGroup: { getAll: () => ENTERPRISE_MACHINE_GROUPS },
}

export function buildHierarchyTree(entityType: HierarchyEntityType): HierarchyNode[] {
  const repo = HIERARCHY_REPOS[entityType]
  if (!repo) return []
  const items = repo.getAll().filter((e) => e.isActive !== false && !e.deletedAt)
  const byId = new Map(items.map((e) => [e.id, e]))
  const roots: HierarchyNode[] = []

  function nodeFor(entity: BaseMasterEntity & { parentId?: string }): HierarchyNode {
    const children = items
      .filter((c) => c.parentId === entity.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(nodeFor)
    return { entityType, entity, children }
  }

  for (const entity of items) {
    if (!entity.parentId || !byId.has(entity.parentId)) {
      roots.push(nodeFor(entity))
    }
  }
  return roots.sort((a, b) => (a.entity.sortOrder ?? 0) - (b.entity.sortOrder ?? 0))
}

export function getHierarchyPath(entityType: HierarchyEntityType, entityId: string): string[] {
  const repo = HIERARCHY_REPOS[entityType]
  if (!repo) return []
  const path: string[] = []
  let current = repo.getAll().find((e) => e.id === entityId)
  while (current) {
    path.unshift(current.name)
    current = current.parentId ? repo.getAll().find((e) => e.id === current!.parentId) : undefined
  }
  return path
}

export function countHierarchyCoverage(): { supported: number; total: number; withParentLinks: number } {
  const types = Object.keys(HIERARCHY_REPOS) as HierarchyEntityType[]
  let withParentLinks = 0
  for (const t of types) {
    withParentLinks += (HIERARCHY_REPOS[t]?.getAll().filter((e) => e.parentId).length ?? 0)
  }
  return { supported: types.length, total: 10, withParentLinks }
}
