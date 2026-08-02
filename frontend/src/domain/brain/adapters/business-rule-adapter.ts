import { BUSINESS_RULES } from '../../services/business-rule-engine'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const businessRuleEngineAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'BUSINESS_RULE_ENGINE',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const orderId = context.scope.orderId
    const relatedRules = orderId
      ? BUSINESS_RULES.filter(
          (r) => r.trigger.includes('ORDER') || r.trigger.includes('PRODUCTION'),
        )
      : BUSINESS_RULES

    return {
      sourceId: 'BUSINESS_RULE_ENGINE',
      fetchedAt: new Date().toISOString(),
      entityKeys: relatedRules.map((r) => r.id),
      summary: `${relatedRules.length} iş kuralı tanımı (read-only katalog)`,
      recordCount: relatedRules.length,
      payload: {
        rules: relatedRules.map((r) => ({
          id: r.id,
          name: r.name,
          trigger: r.trigger,
          invariant: r.invariant,
        })),
        note: 'Brain yalnızca kural kataloğunu okur; kural çalıştırmaz',
      },
    }
  },
}
