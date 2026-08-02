import { BRAIN_KNOWLEDGE_ADAPTERS } from '../adapters'
import { isSourceEnabled } from '../data/brain-config'
import type { BrainContext, BrainKnowledgeFragment, BrainKnowledgeSnapshot } from '../types'
import type { KnowledgeLayerContract } from '../contracts'

let snapshotCounter = 0

export const knowledgeLayer: KnowledgeLayerContract = {
  assembleSnapshot(context: BrainContext): BrainKnowledgeSnapshot {
    snapshotCounter += 1
    const fragments: BrainKnowledgeFragment[] = []

    for (const adapter of BRAIN_KNOWLEDGE_ADAPTERS) {
      if (!isSourceEnabled(context.companyId, adapter.sourceId)) continue
      if (!adapter.isAvailable(context)) continue
      fragments.push(adapter.fetch(context))
    }

    const expectedSources = isSourceEnabled(context.companyId, 'CONFIGURATION')
      ? fragments.find((f) => f.sourceId === 'CONFIGURATION')?.payload.allowedSources
      : null
    const expectedCount = Array.isArray(expectedSources) ? expectedSources.length : fragments.length
    const completenessScore =
      expectedCount > 0 ? Math.round((fragments.length / expectedCount) * 100) / 100 : 1

    return {
      snapshotId: `ksnap-${snapshotCounter}`,
      context,
      fragments,
      assembledAt: new Date().toISOString(),
      sourceCount: fragments.length,
      completenessScore,
    }
  },

  fetchFromSource(sourceId: string, context: BrainContext): BrainKnowledgeFragment | undefined {
    const adapter = BRAIN_KNOWLEDGE_ADAPTERS.find((a) => a.sourceId === sourceId)
    if (!adapter || !isSourceEnabled(context.companyId, adapter.sourceId)) return undefined
    if (!adapter.isAvailable(context)) return undefined
    return adapter.fetch(context)
  },
}
