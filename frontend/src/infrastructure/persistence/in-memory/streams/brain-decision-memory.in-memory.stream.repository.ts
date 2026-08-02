import type { CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'
import type { PersistedBrainDecisionMemory } from '@/domain/ports/persistence/persistence-aggregates'
import type { IBrainDecisionMemoryStreamRepository } from '@/domain/ports/persistence/streams/brain-decision-memory-stream.repository'
import type { DecisionMemoryEntry } from '@/domain/brain/twin/types'

import { paginate } from '../in-memory-helpers'

function toPersisted(tenantId: string, entry: DecisionMemoryEntry, sequence: number): PersistedBrainDecisionMemory {
  return {
    ...entry,
    tenantId,
    streamType: 'brain_decision_memory',
    streamId: entry.companyId,
    sequence,
  }
}

function stripPersisted(row: PersistedBrainDecisionMemory): DecisionMemoryEntry {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

export class BrainDecisionMemoryInMemoryStreamRepository implements IBrainDecisionMemoryStreamRepository {
  private entries: PersistedBrainDecisionMemory[] = []
  private counter = 0

  captureSnapshot(): { entries: PersistedBrainDecisionMemory[]; counter: number } {
    return { entries: structuredClone(this.entries), counter: this.counter }
  }

  restoreSnapshot(state: { entries: PersistedBrainDecisionMemory[]; counter: number }): void {
    this.entries = structuredClone(state.entries)
    this.counter = state.counter
  }

  append(tenantId: string, streamKey: { streamType: string; streamId: string }, events: PersistedBrainDecisionMemory[]): void {
    for (const event of events) {
      this.counter += 1
      this.entries.push({
        ...event,
        tenantId,
        streamType: streamKey.streamType,
        streamId: streamKey.streamId,
        sequence: this.counter,
      })
    }
  }

  stream(tenantId: string, streamKey: { streamType: string; streamId: string }, fromSequence: number): PersistedBrainDecisionMemory[] {
    return this.entries.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(_tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<PersistedBrainDecisionMemory> {
    return paginate(this.entries, page)
  }

  latest(tenantId: string, streamKey: { streamType: string; streamId: string }, count: number): PersistedBrainDecisionMemory[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.entries.some((e) => e.id === eventId)
  }

  cursorByCompanyId(tenantId: string, companyId: string, page: CursorPage): PageResult<PersistedBrainDecisionMemory> {
    const items = this.entries
      .filter((e) => e.tenantId === tenantId && e.companyId === companyId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    return paginate(items, page)
  }

  saveEntry(tenantId: string, entry: DecisionMemoryEntry): DecisionMemoryEntry {
    this.counter += 1
    const persisted = toPersisted(tenantId, entry, this.counter)
    this.entries.push(persisted)
    return stripPersisted(persisted)
  }

  findById(tenantId: string, id: string): DecisionMemoryEntry | null {
    const row = this.entries.find((e) => e.tenantId === tenantId && e.id === id)
    return row ? stripPersisted(row) : null
  }

  updateEntry(tenantId: string, id: string, patch: Partial<DecisionMemoryEntry>): void {
    const idx = this.entries.findIndex((e) => e.tenantId === tenantId && e.id === id)
    if (idx >= 0) this.entries[idx] = { ...this.entries[idx]!, ...patch }
  }

  findByCompany(tenantId: string, companyId: string): DecisionMemoryEntry[] {
    return this.entries
      .filter((e) => e.tenantId === tenantId && e.companyId === companyId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .map(stripPersisted)
  }

  findSimilar(tenantId: string, companyId: string, decisionType: string): DecisionMemoryEntry[] {
    return this.findByCompany(tenantId, companyId).filter(
      (d) => d.decisionType === decisionType && d.outcome === 'SUCCESS',
    )
  }

  nextId(_tenantId: string): string {
    this.counter += 1
    return `dmem-${this.counter}`
  }

  seedFromLegacy(tenantId: string, entries: DecisionMemoryEntry[]): void {
    this.entries = entries.map((e, i) => toPersisted(tenantId, e, i + 1))
    this.counter = entries.length
  }
}

export const brainDecisionMemoryInMemory = new BrainDecisionMemoryInMemoryStreamRepository()
