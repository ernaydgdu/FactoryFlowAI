/** P24 — BrainDecisionMemory stream port */
import type { DecisionMemoryEntry } from '@/domain/brain/twin/types'

import type { CursorPage, PageResult } from '../persistence.types'
import type { PersistedBrainDecisionMemory } from '../persistence-aggregates'
import type { IStreamRepository } from '../repository.base'

export interface IBrainDecisionMemoryStreamRepository extends IStreamRepository<PersistedBrainDecisionMemory> {
  cursorByCompanyId(tenantId: string, companyId: string, page: CursorPage): PageResult<PersistedBrainDecisionMemory>
  saveEntry(tenantId: string, entry: DecisionMemoryEntry): DecisionMemoryEntry
  findById(tenantId: string, id: string): DecisionMemoryEntry | null
  updateEntry(tenantId: string, id: string, patch: Partial<DecisionMemoryEntry>): void
  findByCompany(tenantId: string, companyId: string): DecisionMemoryEntry[]
  findSimilar(tenantId: string, companyId: string, decisionType: string): DecisionMemoryEntry[]
  nextId(tenantId: string): string
  seedFromLegacy(tenantId: string, entries: DecisionMemoryEntry[]): void
}
