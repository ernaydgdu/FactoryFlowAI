/**
 * Brain Personas — uzman servisler, birbirinin domain'ine müdahale etmez.
 */
import type { BrainFocusArea, BrainKnowledgeSourceId } from '../types'
import type { BrainPersona, BrainPersonaId } from '../types/knowledge-reasoning'

export const BRAIN_PERSONAS: BrainPersona[] = [
  {
    id: 'PLANNING_ADVISOR',
    name: 'Planning Advisor',
    domain: 'TERMIN',
    allowedSources: ['PLANNING_ENGINE', 'KPI_ENGINE', 'MASTER_DATA', 'TIMELINE', 'AI_MEMORY'],
    description: 'Termin, kapasite ve planlama riski uzmanı',
  },
  {
    id: 'PURCHASING_ADVISOR',
    name: 'Purchasing Advisor',
    domain: 'PURCHASING',
    allowedSources: ['WORKFLOW', 'STOCK_LEDGER', 'PLANNING_ENGINE', 'BUSINESS_RULE_ENGINE', 'AI_MEMORY'],
    description: 'Satın alma önceliği ve tedarik riski uzmanı',
  },
  {
    id: 'WAREHOUSE_ADVISOR',
    name: 'Warehouse Advisor',
    domain: 'STOCK',
    allowedSources: ['STOCK_LEDGER', 'MASTER_DATA', 'BUSINESS_RULE_ENGINE', 'KPI_ENGINE'],
    description: 'Depo, stok seviyesi ve hareket uzmanı',
  },
  {
    id: 'PRODUCTION_ADVISOR',
    name: 'Production Advisor',
    domain: 'PRODUCTION',
    allowedSources: ['TIMELINE', 'WORKFLOW', 'PLANNING_ENGINE', 'KPI_ENGINE', 'AI_MEMORY'],
    description: 'Üretim akışı ve hat verimliliği uzmanı',
  },
  {
    id: 'QUALITY_ADVISOR',
    name: 'Quality Advisor',
    domain: 'QUALITY',
    allowedSources: ['TIMELINE', 'APPROVAL', 'VERSIONING', 'AI_MEMORY'],
    description: 'Kalite kontrol ve onay süreci uzmanı',
  },
  {
    id: 'COST_ADVISOR',
    name: 'Cost Advisor',
    domain: 'GENERAL',
    allowedSources: ['PLANNING_ENGINE', 'KPI_ENGINE', 'BUSINESS_RULE_ENGINE'],
    description: 'Maliyet ve karlılık analizi uzmanı',
  },
  {
    id: 'EXECUTIVE_ADVISOR',
    name: 'Executive Advisor',
    domain: 'GENERAL',
    allowedSources: ['KPI_ENGINE', 'PLANNING_ENGINE', 'WORKFLOW', 'EVENT_BUS', 'AI_MEMORY'],
    description: 'Üst düzey operasyonel özet ve risk uzmanı',
  },
  {
    id: 'MERCHANDISING_ADVISOR',
    name: 'Merchandising Advisor',
    domain: 'ORDER_RISK',
    allowedSources: ['MASTER_DATA', 'PLANNING_ENGINE', 'TIMELINE', 'APPROVAL', 'LOCALIZATION'],
    description: 'Sipariş, müşteri ve koleksiyon uzmanı',
  },
]

export function getPersonaById(id: BrainPersonaId): BrainPersona | undefined {
  return BRAIN_PERSONAS.find((p) => p.id === id)
}

export function resolvePersonaForFocus(focusArea: BrainFocusArea): BrainPersona {
  const mapping: Partial<Record<BrainFocusArea, BrainPersonaId>> = {
    TERMIN: 'PLANNING_ADVISOR',
    ORDER_RISK: 'MERCHANDISING_ADVISOR',
    CAPACITY: 'PLANNING_ADVISOR',
    STOCK: 'WAREHOUSE_ADVISOR',
    PURCHASING: 'PURCHASING_ADVISOR',
    PRODUCTION: 'PRODUCTION_ADVISOR',
    QUALITY: 'QUALITY_ADVISOR',
    SHIPMENT: 'PLANNING_ADVISOR',
    GENERAL: 'EXECUTIVE_ADVISOR',
  }
  const id = mapping[focusArea] ?? 'EXECUTIVE_ADVISOR'
  return getPersonaById(id)!
}

export function filterSourcesForPersona(
  persona: BrainPersona,
  sources: BrainKnowledgeSourceId[],
): BrainKnowledgeSourceId[] {
  return sources.filter((s) => persona.allowedSources.includes(s))
}

export function assertPersonaBoundary(
  persona: BrainPersona,
  requestedSource: BrainKnowledgeSourceId,
): boolean {
  return persona.allowedSources.includes(requestedSource)
}
