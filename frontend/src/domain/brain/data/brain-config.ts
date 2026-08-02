import {
  ALLOWED_KNOWLEDGE_SOURCES,
  DEFAULT_ALLOWED_OPERATIONS,
  KEPLER_BRAIN_COMPANY_ID,
} from '../constants'
import type { BrainConfiguration, BrainKnowledgeSourceId, BrainOperationMode } from '../types'

const COMPANY_CONFIGS: BrainConfiguration[] = [
  {
    companyId: KEPLER_BRAIN_COMPANY_ID,
    enabled: true,
    offlineFirst: true,
    allowedSources: [...ALLOWED_KNOWLEDGE_SOURCES],
    allowedOperations: [...DEFAULT_ALLOWED_OPERATIONS],
    maxRecommendations: 10,
    maxSimulationsPerSession: 5,
    confidenceThreshold: 0.55,
    retentionDays: 90,
  },
]

export function getCompanyConfiguration(companyId: string): BrainConfiguration {
  return (
    COMPANY_CONFIGS.find((c) => c.companyId === companyId) ?? {
      companyId,
      enabled: false,
      offlineFirst: true,
      allowedSources: [],
      allowedOperations: ['READ'],
      maxRecommendations: 0,
      maxSimulationsPerSession: 0,
      confidenceThreshold: 1,
      retentionDays: 30,
    }
  )
}

export function isSourceEnabled(companyId: string, sourceId: BrainKnowledgeSourceId): boolean {
  const config = getCompanyConfiguration(companyId)
  return config.enabled && config.allowedSources.includes(sourceId)
}

export function isOperationAllowed(companyId: string, operation: BrainOperationMode): boolean {
  const config = getCompanyConfiguration(companyId)
  return config.enabled && config.allowedOperations.includes(operation)
}

export function updateCompanyConfiguration(
  companyId: string,
  patch: Partial<Omit<BrainConfiguration, 'companyId'>>,
): BrainConfiguration {
  const index = COMPANY_CONFIGS.findIndex((c) => c.companyId === companyId)
  if (index < 0) {
    const created: BrainConfiguration = {
      companyId,
      enabled: true,
      offlineFirst: true,
      allowedSources: [...ALLOWED_KNOWLEDGE_SOURCES],
      allowedOperations: [...DEFAULT_ALLOWED_OPERATIONS],
      maxRecommendations: 10,
      maxSimulationsPerSession: 5,
      confidenceThreshold: 0.55,
      retentionDays: 90,
      ...patch,
    }
    COMPANY_CONFIGS.push(created)
    return created
  }
  COMPANY_CONFIGS[index] = { ...COMPANY_CONFIGS[index], ...patch }
  return COMPANY_CONFIGS[index]
}
