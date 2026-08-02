import type { MasterDataDependency, MasterDataDependencyKind } from './types'
import type { MasterDataEntityType } from '../types'
import { MASTER_DATA_DEPENDENCIES } from './enterprise-seed'

export function getDependencies(
  sourceEntityType: MasterDataEntityType,
  sourceEntityId: string,
  kind?: MasterDataDependencyKind,
): MasterDataDependency[] {
  return MASTER_DATA_DEPENDENCIES.filter(
    (d) =>
      d.sourceEntityType === sourceEntityType &&
      d.sourceEntityId === sourceEntityId &&
      (!kind || d.kind === kind),
  ).sort((a, b) => a.priority - b.priority)
}

export function getDependencyChain(sourceEntityType: MasterDataEntityType, sourceEntityId: string): MasterDataDependency[] {
  const chain: MasterDataDependency[] = []
  const visited = new Set<string>()

  function walk(type: MasterDataEntityType, id: string) {
    const key = `${type}:${id}`
    if (visited.has(key)) return
    visited.add(key)
    for (const dep of getDependencies(type, id)) {
      chain.push(dep)
      walk(dep.targetEntityType, dep.targetEntityId)
    }
  }

  walk(sourceEntityType, sourceEntityId)
  return chain
}

export function countDependencyCoverage(): { links: number; chains: number; kinds: number } {
  const kinds = new Set(MASTER_DATA_DEPENDENCIES.map((d) => d.kind))
  const chainSample = getDependencyChain('productGroup', 'pg-tshirt')
  return { links: MASTER_DATA_DEPENDENCIES.length, chains: chainSample.length, kinds: kinds.size }
}
