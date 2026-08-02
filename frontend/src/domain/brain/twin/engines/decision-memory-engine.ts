/**
 * Decision Memory — yalnızca aynı şirket geçmişi. Cross-tenant yasak.
 */
import {
  brainDecisionMemoryRepo,
  DEFAULT_TENANT_ID,
} from '@/domain/platform/platform-persistence-access'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

import type { DecisionMemoryEntry, DecisionOutcome } from '../types'

function nextDecisionId(): string {
  const repo = brainDecisionMemoryRepo()
  const page = repo.cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return `dmem-${page.items.length + 1}`
}

export function recordDecision(
  entry: Omit<DecisionMemoryEntry, 'id' | 'recordedAt' | 'tenantScoped'>,
): DecisionMemoryEntry {
  const repo = brainDecisionMemoryRepo()
  const full: DecisionMemoryEntry = {
    ...entry,
    id: nextDecisionId(),
    recordedAt: new Date().toISOString(),
    tenantScoped: true,
  }
  return repo.saveEntry(DEFAULT_TENANT_ID, full)
}

export function getDecisionHistory(companyId: string, limit = 20): DecisionMemoryEntry[] {
  return brainDecisionMemoryRepo().findByCompany(DEFAULT_TENANT_ID, companyId).slice(0, limit)
}

export function findSimilarDecisions(
  companyId: string,
  decisionType: string,
): DecisionMemoryEntry[] {
  return brainDecisionMemoryRepo().findSimilar(DEFAULT_TENANT_ID, companyId, decisionType)
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
  brainDecisionMemoryRepo().updateEntry(DEFAULT_TENANT_ID, id, { outcome, outcomeNotes: notes })
}
