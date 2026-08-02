import { getCompanyConfiguration } from '../data/brain-config'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const configurationAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'CONFIGURATION',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const config = getCompanyConfiguration(context.companyId)

    return {
      sourceId: 'CONFIGURATION',
      fetchedAt: new Date().toISOString(),
      entityKeys: [context.companyId],
      summary: `Brain ${config.enabled ? 'aktif' : 'pasif'}, ${config.allowedSources.length} kaynak`,
      recordCount: 1,
      payload: {
        enabled: config.enabled,
        offlineFirst: config.offlineFirst,
        allowedOperations: config.allowedOperations,
        allowedSources: config.allowedSources,
        confidenceThreshold: config.confidenceThreshold,
      },
    }
  },
}
