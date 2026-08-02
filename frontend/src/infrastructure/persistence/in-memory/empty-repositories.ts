/**
 * Generic empty in-memory aggregate repository for master-data ports not yet populated.
 */
import type { AggregateRoot, CursorPage, PageResult } from '@/domain/ports/persistence/persistence.types'

import { conflictError, paginate } from './in-memory-helpers'

export class EmptyAggregateInMemoryRepository<T extends AggregateRoot> {
  private readonly items: T[] = []

  findById(_tenantId: string, id: string): T | null {
    return this.items.find((i) => i.id === id) ?? null
  }

  findByIdForUpdate(tenantId: string, id: string): T | null {
    return this.findById(tenantId, id)
  }

  findByCode(_tenantId: string, code: string): T | null {
    const row = this.items.find((i) => 'code' in i && (i as T & { code: string }).code === code)
    return row ?? null
  }

  save(tenantId: string, aggregate: T, options?: { expectedVersion?: number }): T {
    const idx = this.items.findIndex((i) => i.id === aggregate.id)
    if (options?.expectedVersion != null && idx >= 0) {
      const current = this.items[idx]!
      if (current.version !== options.expectedVersion) {
        throw conflictError('Aggregate', aggregate.id, options.expectedVersion, current.version)
      }
    }
    const next = { ...aggregate, tenantId, version: idx >= 0 ? this.items[idx]!.version + 1 : 1 } as T
    if (idx >= 0) this.items[idx] = next
    else this.items.push(next)
    return next
  }

  delete(_tenantId: string, id: string): void {
    const idx = this.items.findIndex((i) => i.id === id)
    if (idx >= 0) this.items.splice(idx, 1)
  }

  exists(_tenantId: string, id: string): boolean {
    return this.items.some((i) => i.id === id)
  }

  version(_tenantId: string, id: string): number {
    return this.findById('kepler-default', id)?.version ?? 0
  }

  cursor(_tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<T> {
    return paginate(this.items, page)
  }
}

export class EmptyStreamInMemoryRepository<T extends { id: string; tenantId: string; streamType: string; streamId: string; sequence: number }> {
  private readonly items: T[] = []
  private counter = 0

  append(tenantId: string, streamKey: { streamType: string; streamId: string }, events: T[]): void {
    for (const event of events) {
      this.counter += 1
      this.items.push({ ...event, tenantId, streamType: streamKey.streamType, streamId: streamKey.streamId, sequence: this.counter })
    }
  }

  stream(tenantId: string, streamKey: { streamType: string; streamId: string }, fromSequence: number): T[] {
    return this.items.filter(
      (e) =>
        e.tenantId === tenantId &&
        e.streamType === streamKey.streamType &&
        e.streamId === streamKey.streamId &&
        e.sequence >= fromSequence,
    )
  }

  cursor(_tenantId: string, _filter: Record<string, unknown>, page: CursorPage): PageResult<T> {
    return paginate(this.items, page)
  }

  latest(tenantId: string, streamKey: { streamType: string; streamId: string }, count: number): T[] {
    return this.stream(tenantId, streamKey, 0).slice(-count)
  }

  exists(_tenantId: string, eventId: string): boolean {
    return this.items.some((e) => e.id === eventId)
  }
}
