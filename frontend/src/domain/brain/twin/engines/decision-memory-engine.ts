/**
 * Decision Memory — yalnızca aynı şirket geçmişi. Cross-tenant yasak.
 */
import type { DecisionMemoryEntry, DecisionOutcome } from '../types'

const decisionStore: DecisionMemoryEntry[] = []
let decisionCounter = 0

const SEED_DECISIONS: Omit<DecisionMemoryEntry, 'id' | 'recordedAt'>[] = [
  {
    companyId: 'company-kepler-001',
    userId: 'user-planner-001',
    decisionType: 'TERMIN_MITIGATION',
    context: 'SIP-2026-0138 termin riski',
    actionTaken: 'Ek vardiya açıldı',
    outcome: 'SUCCESS',
    outcomeNotes: 'Termin kurtuldu — EXF tarihine yetişildi',
    relatedOrderId: '2',
    tenantScoped: true,
  },
  {
    companyId: 'company-kepler-001',
    userId: 'user-ceo-001',
    decisionType: 'CAPACITY_REALLOCATION',
    context: 'Kapasite darboğazı — Hat 4',
    actionTaken: 'Fason Atölye B\'ye yük kaydırıldı',
    outcome: 'PARTIAL',
    outcomeNotes: 'Termin kurtuldu ancak maliyet %8 arttı',
    tenantScoped: true,
  },
]

for (const seed of SEED_DECISIONS) {
  decisionCounter += 1
  decisionStore.push({ ...seed, id: `dmem-${decisionCounter}`, recordedAt: '2026-07-15T10:00:00Z' })
}

export function recordDecision(
  entry: Omit<DecisionMemoryEntry, 'id' | 'recordedAt' | 'tenantScoped'>,
): DecisionMemoryEntry {
  decisionCounter += 1
  const full: DecisionMemoryEntry = {
    ...entry,
    id: `dmem-${decisionCounter}`,
    recordedAt: new Date().toISOString(),
    tenantScoped: true,
  }
  decisionStore.push(full)
  return full
}

export function getDecisionHistory(companyId: string, limit = 20): DecisionMemoryEntry[] {
  return decisionStore
    .filter((d) => d.companyId === companyId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, limit)
}

export function findSimilarDecisions(
  companyId: string,
  decisionType: string,
): DecisionMemoryEntry[] {
  return decisionStore.filter(
    (d) => d.companyId === companyId && d.decisionType === decisionType && d.outcome === 'SUCCESS',
  )
}

export function suggestFromDecisionMemory(
  companyId: string,
  decisionType: string,
): string | undefined {
  const similar = findSimilarDecisions(companyId, decisionType)
  if (similar.length === 0) return undefined
  const best = similar[0]
  return `Benzer durumda daha önce "${best.actionTaken}" uygulandı — sonuç: ${best.outcomeNotes}`
}

export function assertNoCrossTenantAccess(requestCompanyId: string, entryCompanyId: string): void {
  if (requestCompanyId !== entryCompanyId) {
    throw new Error('DECISION_MEMORY: Cross-tenant erişim yasak')
  }
}

export function updateDecisionOutcome(id: string, outcome: DecisionOutcome, notes: string): void {
  const entry = decisionStore.find((d) => d.id === id)
  if (entry) {
    entry.outcome = outcome
    entry.outcomeNotes = notes
  }
}
