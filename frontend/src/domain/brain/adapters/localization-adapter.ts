import { createLocalizationEngine } from '../../localization/services/localization-engine'
import { KEPLER_COMPANY_ID } from '../../localization/data/localization-demo'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const localizationAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'LOCALIZATION',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const engine = createLocalizationEngine(context.userId, context.companyId)

    return {
      sourceId: 'LOCALIZATION',
      fetchedAt: new Date().toISOString(),
      entityKeys: [context.userId],
      summary: engine
        ? `Dil: ${engine.context.languageCode}, locale: ${engine.context.locale}`
        : 'Localization context unavailable',
      recordCount: 1,
      payload: {
        languageCode: engine?.context.languageCode,
        locale: engine?.context.locale,
        currency: engine?.context.currency.code,
        unitSystem: engine?.context.region.unitSystem,
        companyId: context.companyId,
        defaultCompanyId: KEPLER_COMPANY_ID,
      },
    }
  },
}
