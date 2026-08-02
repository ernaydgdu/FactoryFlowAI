import { masterDataEnterpriseConfig } from '../master-data-port-access'
import type { MasterDataDependency, MasterDataDependencyKind } from './types'
import type { MasterDataEntityType } from '../types'

function configRepo() {
  return masterDataEnterpriseConfig()
}

export function getDependencies(
  sourceEntityType: MasterDataEntityType,
  sourceEntityId: string,
  kind?: MasterDataDependencyKind,
): MasterDataDependency[] {
  return configRepo()
    .getDependencies()
    .filter(
      (d) =>
        d.sourceEntityType === sourceEntityType &&
        d.sourceEntityId === sourceEntityId &&
        (!kind || d.kind === kind),
    )
    .sort((a, b) => a.priority - b.priority)
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
  const deps = configRepo().getDependencies()
  const kinds = new Set(deps.map((d) => d.kind))
  const chainSample = getDependencyChain('productGroup', 'pg-tshirt')
  return { links: deps.length, chains: chainSample.length, kinds: kinds.size }
}
