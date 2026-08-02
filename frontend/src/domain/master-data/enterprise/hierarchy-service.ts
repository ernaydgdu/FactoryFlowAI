import { masterDataEnterpriseConfig } from '../master-data-port-access'
import type { BaseMasterEntity } from '../types'
import type { HierarchyEntityType } from './types'
import {
  accessoryCategoryRepository,
  countryRepository,
  operationRepository,
  productGroupRepository,
  warehouseRepository,
} from '../repositories'

type HierarchyNode = {
  entityType: HierarchyEntityType
  entity: BaseMasterEntity & { parentId?: string }
  children: HierarchyNode[]
}

function configRepo() {
  return masterDataEnterpriseConfig()
}

const HIERARCHY_REPOS: Partial<
  Record<HierarchyEntityType, { getAll(): Array<BaseMasterEntity & { parentId?: string }> }>
> = {
  productGroup: productGroupRepository,
  warehouse: warehouseRepository,
  operation: operationRepository,
  accessoryCategory: accessoryCategoryRepository,
  fabricCategory: { getAll: () => configRepo().getHierarchyEntities('fabricCategory') },
  customerGroup: { getAll: () => configRepo().getHierarchyEntities('customerGroup') },
  supplierGroup: { getAll: () => configRepo().getHierarchyEntities('supplierGroup') },
  country: countryRepository,
  department: { getAll: () => configRepo().getHierarchyEntities('department') },
  machineGroup: { getAll: () => configRepo().getHierarchyEntities('machineGroup') },
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
    withParentLinks += HIERARCHY_REPOS[t]?.getAll().filter((e) => e.parentId).length ?? 0
  }
  return { supported: types.length, total: 10, withParentLinks }
}
